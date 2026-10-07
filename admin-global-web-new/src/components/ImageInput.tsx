import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';
import { ACCEPTED_IMAGE_INPUT } from '../lib/constants';
import { imageFileProblem } from '../lib/upload';
import { codeText, errorText } from '../lib/errors';

type ImageInputProps = {
  label: ReactNode;
  /** The stored image. */
  url?: string | null;
  shape?: 'square' | 'wide';
  hint?: ReactNode;
  disabled?: boolean;
  /**
   * Upload right away (the entity exists). Rejections are shown with a Retry
   * button that re-sends the same file.
   */
  onUpload?: (file: File) => Promise<void>;
  /** Clear the stored image. */
  onRemove?: () => Promise<void>;
  /** Pick a file to upload later (the entity does not exist yet). */
  onSelect?: (file: File | null) => void;
  /** The file picked through onSelect (previewed locally). */
  selectedFile?: File | null;
};

/** Image preview with upload / replace / remove (jpeg, png, webp; ≤ 5 MB). */
export function ImageInput({
  label,
  url,
  shape = 'square',
  hint,
  disabled = false,
  onUpload,
  onRemove,
  onSelect,
  selectedFile,
}: ImageInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);

  const localPreview = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );
  const preview = localPreview ?? url ?? null;

  const upload = async (file: File) => {
    setError(null);
    setFailedFile(null);
    setBusy('upload');
    try {
      await onUpload?.(file);
    } catch (err) {
      setError(errorText(err, t('Upload.failed')));
      setFailedFile(file);
    } finally {
      setBusy(null);
    }
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      setError(codeText(problem));
      return;
    }
    if (onUpload) void upload(file);
    else {
      setError(null);
      onSelect?.(file);
    }
  };

  const remove = async () => {
    if (selectedFile && onSelect) {
      onSelect(null);
      return;
    }
    if (!onRemove) return;
    setError(null);
    setBusy('remove');
    try {
      await onRemove();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const frame = shape === 'square' ? 'h-20 w-20' : 'h-24 w-full max-w-xs';
  const canRemove = !!(selectedFile && onSelect) || (!!url && !!onRemove);

  return (
    <div>
      <p className="mb-1 block text-sm font-medium text-gray-700">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`${frame} flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-gray-400">{t('Upload.noImage')}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled || busy !== null}
            loading={busy === 'upload'}
            loadingText={t('Upload.uploading')}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? t('Upload.replace') : t('Upload.choose')}
          </Button>
          {canRemove && (
            <Button
              variant="dangerOutline"
              size="sm"
              disabled={disabled || busy !== null}
              loading={busy === 'remove'}
              loadingText={t('Common.saving')}
              onClick={() => void remove()}
            >
              {t('Upload.remove')}
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_INPUT}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-red-600">
          <span>{error}</span>
          {failedFile && (
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => void upload(failedFile)}
              disabled={busy !== null}
            >
              {t('Common.retry')}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs text-gray-500">{hint ?? t('Upload.rules')}</p>
      )}
    </div>
  );
}
