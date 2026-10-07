import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { CITIES, type City } from '../graphql/spots';
import { CREATE_NEWS, BROADCAST_TO_CLIENTS, BROADCAST_TO_CITY } from '../graphql/admin';
import { uploadNewsImage } from '../lib/upload';
import { errorText } from '../lib/errors';
import { cityName } from '../lib/format';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

type Tab = 'news' | 'notification';

export function NewsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('news');

  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('News.title')}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {t('News.subtitle')}
      </p>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(['news', 'notification'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`relative px-4 py-2.5 text-sm font-semibold ${
              tab === tabKey ? 'text-brand' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tabKey === 'news' ? t('News.tabNews') : t('News.tabNotification')}
            {tab === tabKey && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      {tab === 'news' ? <NewsForm /> : <NotificationForm />}
    </div>
  );
}

function NewsForm() {
  const { t } = useTranslation();
  const { data: citiesData } = useQuery<{ cities: City[] }>(CITIES);
  const [createNews, { loading: creating }] = useMutation<{ createNews: { id: string } }>(
    CREATE_NEWS,
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allCities, setAllCities] = useState(true);
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const loading = creating || uploading;

  const toggleCity = (id: string) =>
    setCityIds((ids) => (ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      // Backend JSON.parse()s titleLocal/descriptionLocal, so send JSON strings.
      const res = await createNews({
        variables: {
          input: {
            title,
            titleLocal: JSON.stringify({ pl: title, en: title, ua: title }),
            description,
            descriptionLocal: JSON.stringify({ pl: description, en: description, ua: description }),
            // Empty array = all cities (backend default).
            targetCityIds: allCities ? [] : cityIds,
          },
        },
      });
      const newsId = res.data?.createNews.id;
      if (newsId && files.length > 0) {
        setUploading(true);
        for (const file of files) {
          await uploadNewsImage(newsId, file);
        }
        setUploading(false);
      }
      setNotice(t('News.newsPublished'));
      setTitle('');
      setDescription('');
      setCityIds([]);
      setAllCities(true);
      setFiles([]);
    } catch (err) {
      setUploading(false);
      setError(errorText(err, t('News.failedPublish')));
    }
  };

  const cities = citiesData?.cities ?? [];

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">{notice}</div>}

      <div>
        <label className={label}>{t('News.titleLabel')}</label>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className={label}>{t('Common.description')}</label>
        <textarea
          className={input}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={label}>{t('News.photos')}</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand"
        />
        {files.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {t('News.photosSelected', { count: files.length })}
          </p>
        )}
      </div>

      <div>
        <label className={label}>{t('News.audience')}</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={allCities} onChange={() => setAllCities(true)} />
            {t('News.allCities')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!allCities} onChange={() => setAllCities(false)} />
            {t('News.specificCities')}
          </label>
        </div>
        {!allCities && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCity(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  cityIds.includes(c.id)
                    ? 'border-brand bg-brand-light text-brand'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {cityName(c)}
              </button>
            ))}
            {cities.length === 0 && <p className="text-sm text-gray-400">{t('News.noCitiesYet')}</p>}
          </div>
        )}
      </div>

      <button
        disabled={loading || (!allCities && cityIds.length === 0)}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? t('News.publishing') : t('News.publishNews')}
      </button>
    </form>
  );
}

function NotificationForm() {
  const { t } = useTranslation();
  const { data: citiesData } = useQuery<{ cities: City[] }>(CITIES);
  const [broadcastAll, { loading: loadingAll }] = useMutation(BROADCAST_TO_CLIENTS);
  const [broadcastCity, { loading: loadingCity }] = useMutation(BROADCAST_TO_CITY);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [allCities, setAllCities] = useState(true);
  const [cityId, setCityId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loading = loadingAll || loadingCity;
  const cities = citiesData?.cities ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      if (allCities) {
        await broadcastAll({ variables: { title, body, language: 'pl' } });
        setNotice(t('News.notifSentAll'));
      } else {
        const res = await broadcastCity({ variables: { cityId, title, body, language: 'pl' } });
        const delivered = (res.data as { broadcastToCity?: boolean } | null)?.broadcastToCity;
        setNotice(delivered ? t('News.notifSentCity') : t('News.noClientsCity'));
      }
      setTitle('');
      setBody('');
    } catch (err) {
      setError(errorText(err, t('News.failedSendNotif')));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">{notice}</div>}

      <div>
        <label className={label}>{t('News.titleLabel')}</label>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className={label}>{t('News.message')}</label>
        <textarea className={input} rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>

      <div>
        <label className={label}>{t('News.audience')}</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={allCities} onChange={() => setAllCities(true)} />
            {t('News.allClients')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!allCities} onChange={() => setAllCities(false)} />
            {t('News.clientsSpecificCity')}
          </label>
        </div>
        {!allCities && (
          <select
            className={`${input} mt-3`}
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            required
          >
            <option value="">{t('News.selectCity')}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {cityName(c)}
              </option>
            ))}
          </select>
        )}
        {!allCities && (
          <p className="mt-2 text-xs text-gray-500">
            {t('News.notifCityHint')}
          </p>
        )}
      </div>

      <button
        disabled={loading || (!allCities && !cityId)}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? t('Common.sending') : t('News.sendNotification')}
      </button>
    </form>
  );
}
