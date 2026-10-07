"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useI18n } from "../../i18n/I18nProvider";
import {
  BUSINESS_TYPES,
  LEAD_FIELDS,
  LEAD_LANGUAGE,
  LEAD_LIMITS,
  SERVER_FIELD_ERROR,
  emptyLeadForm,
  submitBusinessLead,
  toLeadInput,
  validateLeadField,
  validateLeadForm,
  type BusinessType,
  type LeadErrorCode,
  type LeadErrors,
  type LeadField,
  type LeadFormValues,
} from "../../lib/business-lead";
import { IconAlert, IconCheck } from "./BizIcons";
import { BTN_PRIMARY, BTN_SECONDARY, FOCUS_RING } from "./ui";

/**
 * "Let's talk about your locations" request form (`/for-business`, `#get-in-touch`).
 *
 * - Client rules mirror the server (`app/lib/business-lead.ts`). Errors show
 *   after a submit attempt (and on blur for filled fields), then update live
 *   while the person fixes them.
 * - A failed submit moves focus to the error summary (field errors, with links
 *   to each field) or to the form-level alert (rate limit, network, server).
 * - Success replaces the form with a thank-you panel; focus moves to its heading.
 * - `website` is a honeypot: off-screen, hidden from assistive tech, not in the
 *   tab order, never autofilled. Its value is sent as is.
 */

type FormError = "invalid" | "rate_limited" | "network" | "server";
type FocusTarget = "summary" | "form-error" | "success" | "first-field";

const fieldId = (f: LeadField) => `lead-${f}`;
/** The element that receives focus for a field (the first chip for the type group). */
const focusId = (f: LeadField) => (f === "businessTypes" ? `${fieldId(f)}-${BUSINESS_TYPES[0]}` : fieldId(f));

const INPUT =
  "mt-2 block min-h-[48px] w-full rounded-xl border-2 bg-white px-4 py-2.5 text-base text-espresso placeholder:text-espresso/50 transition-colors scroll-mt-24 hover:border-espresso/70 focus:border-berry focus:outline-none focus:ring-4 focus:ring-berry/20";
const INPUT_OK = "border-espresso/50";
const INPUT_ERR = "border-red-700";

const errorKey = (code: LeadErrorCode | FormError) => `business.contact.errors.${code}`;

/** Focus without the browser's jump, then scroll so the fixed header does not cover it. */
function reveal(el: HTMLElement | null, block: ScrollLogicalPosition) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block });
}

export function BusinessLeadForm({ fallbackEmail, fallbackHref }: { fallbackEmail: string; fallbackHref: string }) {
  const { t, locale } = useI18n();
  const [values, setValues] = useState<LeadFormValues>(emptyLeadForm);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [focus, setFocus] = useState<{ target: FocusTarget; n: number } | null>(null);

  const inFlight = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Focus moves after the DOM it targets has rendered.
  useEffect(() => {
    if (!focus) return;
    if (focus.target === "summary") reveal(summaryRef.current, "start");
    else if (focus.target === "form-error") reveal(formErrorRef.current, "center");
    else if (focus.target === "success") reveal(successRef.current, "center");
    else reveal(document.getElementById(focusId(LEAD_FIELDS[0])), "center");
  }, [focus]);

  const requestFocus = (target: FocusTarget) => setFocus((f) => ({ target, n: (f?.n ?? 0) + 1 }));

  const setFieldError = (field: LeadField, code: LeadErrorCode | undefined) =>
    setErrors((prev) => {
      if (prev[field] === code) return prev;
      const next = { ...prev };
      if (code) next[field] = code;
      else delete next[field];
      return next;
    });

  const update = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    // A field that shows an error is re-checked while it is being fixed.
    if (key !== "website" && errors[key as LeadField]) {
      setFieldError(key as LeadField, validateLeadField(key as LeadField, next));
    }
  };

  /** On blur, check filled fields (empty ones wait for submit, so nothing nags on the way through). */
  const onBlurField = (field: LeadField) => {
    const v = values[field];
    if (typeof v === "string" && !v.trim() && !errors[field]) return;
    setFieldError(field, validateLeadField(field, values));
  };

  const toggleType = (type: BusinessType) =>
    update(
      "businessTypes",
      values.businessTypes.includes(type)
        ? values.businessTypes.filter((x) => x !== type)
        : [...values.businessTypes, type],
    );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlight.current) return;
    setFormError(null);

    const found = validateLeadForm(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setShowSummary(true);
      requestFocus("summary");
      return;
    }
    setShowSummary(false);

    inFlight.current = true;
    setSubmitting(true);
    const result = await submitBusinessLead(toLeadInput(values, LEAD_LANGUAGE[locale] ?? null));
    inFlight.current = false;
    setSubmitting(false);

    if (result.ok) {
      setSent(true);
      requestFocus("success");
      return;
    }
    if (result.kind === "invalid" && result.fields.length) {
      const server: LeadErrors = {};
      for (const f of result.fields) server[f] = SERVER_FIELD_ERROR[f];
      setErrors(server);
      setShowSummary(true);
      requestFocus("summary");
      return;
    }
    setFormError(result.kind);
    requestFocus("form-error");
  };

  const reset = () => {
    setValues(emptyLeadForm());
    setErrors({});
    setShowSummary(false);
    setFormError(null);
    setSent(false);
    requestFocus("first-field");
  };

  const fallback = fallbackEmail ? (
    <>
      {" "}
      {t("business.contact.or_email")}{" "}
      <a href={fallbackHref} className={`break-all font-semibold underline underline-offset-2 ${FOCUS_RING}`}>
        {fallbackEmail}
      </a>
      .
    </>
  ) : null;

  if (sent) {
    return (
      <div className="rounded-3xl bg-cream-soft px-5 py-10 text-center sm:px-10">
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pistachio text-espresso-dark"
        >
          <IconCheck className="h-7 w-7" strokeWidth={3} />
        </span>
        <h3
          ref={successRef}
          tabIndex={-1}
          aria-describedby="lead-success-body"
          className="mt-5 scroll-mt-24 text-2xl font-black tracking-tight text-espresso outline-none"
        >
          {t("business.contact.success.title")}
        </h3>
        <p id="lead-success-body" className="mx-auto mt-2 max-w-md text-lg leading-relaxed text-espresso/70">
          {t("business.contact.success.body")}
        </p>
        <button type="button" onClick={reset} className={`mt-7 w-full sm:w-auto ${BTN_SECONDARY}`}>
          {t("business.contact.success.again")}
        </button>
      </div>
    );
  }

  const summaryFields = LEAD_FIELDS.filter((f) => errors[f]);
  const optional = t("business.contact.form.optional");
  const err = (f: LeadField) => (errors[f] ? t(errorKey(errors[f] as LeadErrorCode)) : undefined);

  const textProps = (field: Exclude<LeadField, "businessTypes" | "consent">) => ({
    field,
    value: values[field],
    error: err(field),
    onValue: (v: string) => update(field, v),
    onBlur: () => onBlurField(field),
  });

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={submitting} className="text-left">
      {showSummary && summaryFields.length ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          aria-labelledby="lead-summary-title"
          role="group"
          className="mb-8 scroll-mt-24 rounded-2xl border-2 border-red-700 bg-red-50 p-5 outline-none"
        >
          <h3 id="lead-summary-title" className="flex items-center gap-2 text-lg font-bold text-red-800">
            <IconAlert className="h-5 w-5 shrink-0" />
            {t("business.contact.errors.summary_title")}
          </h3>
          <ul className="mt-2 space-y-1">
            {summaryFields.map((f) => (
              <li key={f}>
                <a
                  href={`#${focusId(f)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    reveal(document.getElementById(focusId(f)), "center");
                  }}
                  className={`inline-flex min-h-[44px] items-center py-1.5 font-semibold leading-snug text-red-800 underline underline-offset-2 ${FOCUS_RING}`}
                >
                  {err(f)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <TextField
          {...textProps("companyName")}
          label={t("business.contact.form.company")}
          autoComplete="organization"
          maxLength={LEAD_LIMITS.nameMax}
        />
        <TextField
          {...textProps("contactName")}
          label={t("business.contact.form.name")}
          autoComplete="name"
          maxLength={LEAD_LIMITS.nameMax}
        />
        <TextField
          {...textProps("email")}
          label={t("business.contact.form.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LEAD_LIMITS.emailMax}
        />
        <TextField
          {...textProps("phone")}
          label={t("business.contact.form.phone")}
          type="tel"
          autoComplete="tel"
          maxLength={LEAD_LIMITS.phoneMax}
        />
        <TextField
          {...textProps("city")}
          label={t("business.contact.form.city")}
          optional={optional}
          autoComplete="address-level2"
          maxLength={LEAD_LIMITS.cityMax}
        />
        {/* Text + numeric keyboard rather than type=number: no wheel/arrow surprises, and our own messages. */}
        <TextField
          {...textProps("spotsCount")}
          label={t("business.contact.form.spots")}
          note={t("business.contact.form.spots_note")}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={3}
        />

        <fieldset
          className="sm:col-span-2"
          aria-describedby={["lead-businessTypes-hint", errors.businessTypes ? "lead-businessTypes-error" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <legend className="text-sm font-semibold text-espresso">{t("business.contact.form.types")}</legend>
          <p id="lead-businessTypes-hint" className="mt-1 text-sm text-espresso/70">
            {t("business.contact.form.types_hint")}
          </p>
          <FieldError id="lead-businessTypes-error" message={err("businessTypes")} />
          <div className="mt-3 flex flex-wrap gap-2.5">
            {BUSINESS_TYPES.map((type) => {
              const checked = values.businessTypes.includes(type);
              return (
                <label key={type} className="relative inline-flex max-w-full">
                  <input
                    id={`${fieldId("businessTypes")}-${type}`}
                    type="checkbox"
                    name="businessTypes"
                    value={type}
                    checked={checked}
                    onChange={() => toggleType(type)}
                    aria-invalid={errors.businessTypes ? true : undefined}
                    className={`peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none rounded-full scroll-mt-24 ${FOCUS_RING}`}
                  />
                  <span
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                      checked
                        ? "border-berry bg-berry text-white"
                        : errors.businessTypes
                          ? "border-red-700 bg-white text-espresso peer-hover:bg-cream-soft"
                          : "border-espresso/50 bg-white text-espresso peer-hover:border-berry peer-hover:bg-cream-soft"
                    }`}
                  >
                    {checked ? <IconCheck className="h-4 w-4 shrink-0" strokeWidth={3} /> : null}
                    {t(`business.contact.form.type.${type}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <TextField
          {...textProps("currentSystem")}
          className="sm:col-span-2"
          label={t("business.contact.form.system")}
          optional={optional}
          hint={t("business.contact.form.system_hint")}
          autoComplete="off"
          maxLength={LEAD_LIMITS.systemMax}
        />
        <TextField
          {...textProps("message")}
          className="sm:col-span-2"
          label={t("business.contact.form.message")}
          optional={optional}
          hint={t("business.contact.form.message_hint")}
          multiline
          maxLength={LEAD_LIMITS.messageMax}
        />

        <div className="sm:col-span-2">
          <FieldError id="lead-consent-error" message={err("consent")} />
          <div className="mt-1 flex items-start gap-3">
            <input
              id={fieldId("consent")}
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={(e) => update("consent", e.target.checked)}
              required
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "lead-consent-error" : undefined}
              className={`mt-2.5 h-6 w-6 shrink-0 cursor-pointer scroll-mt-24 accent-berry ${FOCUS_RING}`}
            />
            <label htmlFor={fieldId("consent")} className="min-h-[44px] cursor-pointer py-2 text-sm leading-6 text-espresso/80">
              {t("business.contact.form.consent_before")}
              <a
                href="/policy"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold text-berry underline underline-offset-2 ${FOCUS_RING}`}
              >
                {t("business.contact.form.consent_link")}
                <span className="sr-only"> {t("business.contact.form.new_tab")}</span>
              </a>
              {t("business.contact.form.consent_after")}
            </label>
          </div>
        </div>
      </div>

      {/* Honeypot: off-screen and hidden from assistive tech; people never fill it. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-0 h-px w-px overflow-hidden">
        <label htmlFor="lead-website">Website</label>
        <input
          id="lead-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      {formError ? (
        <div
          ref={formErrorRef}
          tabIndex={-1}
          role="alert"
          className="mt-8 scroll-mt-24 rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-red-800 outline-none"
        >
          <p className="flex items-start gap-2">
            <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              <span className="font-semibold">{t(errorKey(formError))}</span>
              {fallback}
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-stretch sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting}
          className={`${BTN_PRIMARY} disabled:cursor-wait disabled:opacity-75 disabled:hover:scale-100`}
        >
          {submitting ? <Spinner /> : null}
          {submitting ? t("business.contact.form.submitting") : t("business.contact.form.submit")}
        </button>
      </div>
      <p role="status" className="sr-only">
        {submitting ? t("business.contact.form.submitting") : ""}
      </p>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-700">
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

type TextFieldProps = {
  field: LeadField;
  label: string;
  value: string;
  onValue: (v: string) => void;
  onBlur: () => void;
  error?: string;
  hint?: string;
  /** Visible "(optional)" text; required fields get the `required` attribute instead. */
  optional?: string;
  /** Short muted text inside the label, e.g. an allowed range. Keeps paired fields aligned. */
  note?: string;
  multiline?: boolean;
  className?: string;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "autoComplete" | "autoCapitalize" | "spellCheck" | "maxLength" | "pattern"
>;

function TextField({
  field,
  label,
  value,
  onValue,
  onBlur,
  error,
  hint,
  optional,
  note,
  multiline,
  className = "",
  type = "text",
  ...rest
}: TextFieldProps) {
  const id = fieldId(field);
  const hintId = hint ? `${id}-hint` : "";
  const errorId = error ? `${id}-error` : "";
  const shared = {
    id,
    name: field,
    value,
    onBlur,
    required: !optional,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    className: `${INPUT} ${error ? INPUT_ERR : INPUT_OK}`,
  } as const;

  let control: ReactNode;
  if (multiline) {
    control = (
      <textarea
        {...shared}
        rows={5}
        maxLength={rest.maxLength}
        onChange={(e) => onValue(e.target.value)}
        className={`${shared.className} resize-y`}
      />
    );
  } else {
    control = <input {...shared} {...rest} type={type} onChange={(e) => onValue(e.target.value)} />;
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-espresso">
        {label}
        {note ? <span className="font-normal text-espresso/70"> {note}</span> : null}
        {optional ? <span className="font-normal text-espresso/70"> {optional}</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-espresso/70">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
      {control}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 motion-safe:animate-spin" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
