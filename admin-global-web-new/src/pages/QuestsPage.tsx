import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Alert } from '../components/ui/Alert';
import { errorText } from '../lib/errors';
import {
  QUESTS,
  CREATE_QUEST,
  UPDATE_QUEST,
  DELETE_QUEST,
  type Quest,
} from '../graphql/quests';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

const QUEST_TYPES = ['CUSTOM', 'PURCHASE', 'VISIT', 'REFERRAL', 'BIRTHDAY'];

const TYPE_ICON: Record<string, string> = {
  REFERRAL: '👥',
  BIRTHDAY: '🎂',
  PURCHASE: '🛒',
  VISIT: '📍',
  CUSTOM: '🎯',
};

export function QuestsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ quests: Quest[] }>(QUESTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [editing, setEditing] = useState<Quest | null>(null);

  const quests = data?.quests ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('Quests.title')}</h1>
        <p className="text-sm text-gray-500">{t('Quests.subtitle')}</p>
      </div>

      {/* Quests are frozen (E21): no new ones, no points; kept for history. */}
      <Alert tone="warning" className="mb-6">
        {t('Quests.legacyBanner')}
      </Alert>

      {loading && !data && <p className="text-sm text-gray-500">{t('Common.loading')}</p>}

      <div className="space-y-3">
        {quests.map((q) => (
          <QuestRow key={q.id} quest={q} onEdit={() => setEditing(q)} />
        ))}
        {!loading && quests.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            {t('Quests.noQuestsYet')}
          </div>
        )}
      </div>

      {editing && <QuestModal quest={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function QuestRow({ quest, onEdit }: { quest: Quest; onEdit: () => void }) {
  const { t } = useTranslation();
  const [updateQuest] = useMutation(UPDATE_QUEST, { refetchQueries: [{ query: QUESTS }] });
  const toggle = () => updateQuest({ variables: { id: quest.id, isActive: !quest.isActive } });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-xl">
        {TYPE_ICON[quest.type] ?? '🎯'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{quest.title}</p>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {t(`Quests.types.${quest.type}`, { defaultValue: quest.type })}
          </span>
          {quest.isRepeatable && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              {t('Quests.repeatable')}
            </span>
          )}
        </div>
        {quest.description && (
          <p className="mt-0.5 truncate text-sm text-gray-500">{quest.description}</p>
        )}
        <p className="mt-0.5 text-sm font-semibold text-brand">{t('Quests.pointsReward', { count: quest.pointsReward })}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          quest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {quest.isActive ? t('Common.active') : t('Common.disabled')}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('Common.edit')}
        </button>
        <button
          onClick={toggle}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            quest.isActive
              ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          {quest.isActive ? t('Common.disable') : t('Common.enable')}
        </button>
      </div>
    </div>
  );
}

function QuestModal({ quest, onClose }: { quest: Quest | null; onClose: () => void }) {
  const { t } = useTranslation();
  const isEdit = !!quest;
  const [createQuest] = useMutation(CREATE_QUEST, { refetchQueries: [{ query: QUESTS }] });
  const [updateQuest] = useMutation(UPDATE_QUEST, { refetchQueries: [{ query: QUESTS }] });
  const [deleteQuest] = useMutation(DELETE_QUEST, { refetchQueries: [{ query: QUESTS }] });

  const [form, setForm] = useState({
    type: quest?.type ?? 'CUSTOM',
    title: quest?.title ?? '',
    description: quest?.description ?? '',
    pointsReward: String(quest?.pointsReward ?? ''),
    isRepeatable: quest?.isRepeatable ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const common = {
        title: form.title,
        description: form.description || null,
        pointsReward: parseInt(form.pointsReward, 10),
        isRepeatable: form.isRepeatable,
      };
      if (isEdit) {
        await updateQuest({ variables: { id: quest!.id, ...common } });
      } else {
        await createQuest({
          variables: { ...common, type: form.type, isActive: true, targetCityIds: [] },
        });
      }
      onClose();
    } catch (err) {
      setError(errorText(err, t('Quests.failedSave')));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!quest || !confirm(t('Quests.confirmDelete', { title: quest.title }))) return;
    setBusy(true);
    try {
      await deleteQuest({ variables: { id: quest.id } });
      onClose();
    } catch (err) {
      setError(errorText(err, t('Quests.failedDelete')));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {isEdit ? t('Quests.editQuest') : t('Quests.createQuestTitle')}
        </h2>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-3">
          {!isEdit && (
            <div>
              <label className={label}>{t('Quests.type')}</label>
              <select
                className={input}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {QUEST_TYPES.map((qt) => (
                  <option key={qt} value={qt}>
                    {t(`Quests.types.${qt}`, { defaultValue: qt })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={label}>{t('Quests.questTitle')}</label>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={label}>{t('Common.description')}</label>
            <textarea
              className={input}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>{t('Quests.pointsRewardLabel')}</label>
            <input
              className={input}
              type="number"
              value={form.pointsReward}
              onChange={(e) => setForm((f) => ({ ...f, pointsReward: e.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isRepeatable}
              onChange={(e) => setForm((f) => ({ ...f, isRepeatable: e.target.checked }))}
            />
            {t('Quests.repeatableCheckbox')}
          </label>

          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {t('Common.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('Common.cancel')}
            </button>
            <button
              disabled={busy}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? t('Common.saving') : isEdit ? t('Common.save') : t('Common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
