import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  NotebookPen,
  Plus,
  Trash2,
  Star,
  Tag,
  Smile,
  Edit3,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
  journalTypeConfig,
} from '@/services/journal.service';
import { fetchAssets } from '@/services/asset.service';
import { formatTimeAgo, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import type { Asset, JournalEntryType } from '@/types';

export function JournalPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', profile?.id],
    queryFn: () => fetchJournalEntries(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchAssets(),
    staleTime: 300_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal', profile?.id] }),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('journal.title')}</h1>
          <p className="text-sm text-secondary-400 mt-1">{t('journal.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('journal.add')}
        </button>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
            <NotebookPen className="w-8 h-8 text-secondary-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-secondary-200 font-medium">{t('journal.empty')}</p>
            <p className="text-sm text-secondary-400 mt-1">{t('journal.emptyDesc')}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('journal.add')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const config = journalTypeConfig[entry.entry_type];
            return (
              <div key={entry.id} className="card p-5 hover:bg-surface-1/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('badge text-xs', config.bg, config.color)}>
                        {t(config.labelKey)}
                      </span>
                      <Link
                        to={`/assets/${entry.asset?.symbol}`}
                        className="text-sm font-medium text-primary-300 hover:text-primary-200"
                      >
                        {entry.asset?.symbol}
                      </Link>
                      <span className="text-xs text-secondary-500">
                        {formatTimeAgo(entry.created_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-secondary-100 mb-1">
                      {entry.title}
                    </h3>
                    {entry.content && (
                      <p className="text-sm text-secondary-300 leading-relaxed mb-3">
                        {entry.content}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {entry.emotion && (
                        <span className="inline-flex items-center gap-1 text-xs text-secondary-400">
                          <Smile className="w-3.5 h-3.5" />
                          {entry.emotion}
                        </span>
                      )}
                      {entry.rating !== null && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-warning-300">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn('w-3 h-3', i < (entry.rating ?? 0) ? 'fill-warning-400 text-warning-400' : 'text-surface-4')}
                            />
                          ))}
                        </span>
                      )}
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 badge bg-surface-3 text-secondary-400 text-xs">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className="text-secondary-500 hover:text-error-400 transition-colors p-1.5 rounded-lg hover:bg-error-500/10 shrink-0"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && assets && (
        <AddJournalModal
          assets={assets}
          onClose={() => setShowAdd(false)}
          onAdd={async (assetId, entryType, title, content, emotion, tags, rating) => {
            await createJournalEntry(profile!.id, assetId, entryType, title, content, emotion, tags, rating);
            queryClient.invalidateQueries({ queryKey: ['journal', profile?.id] });
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddJournalModal({
  assets,
  onClose,
  onAdd,
}: {
  assets: Asset[];
  onClose: () => void;
  onAdd: (
    assetId: string,
    entryType: JournalEntryType,
    title: string,
    content: string,
    emotion?: string,
    tags?: string[],
    rating?: number
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [assetId, setAssetId] = useState('');
  const [entryType, setEntryType] = useState<JournalEntryType>('buy');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) { setError(t('portfolio.errors.selectAsset')); return; }
    if (!title.trim()) { setError(t('journal.errors.titleRequired')); return; }
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    await onAdd(assetId, entryType, title.trim(), content.trim(), emotion.trim() || undefined, tagArray, rating || undefined);
  };

  const entryTypes: JournalEntryType[] = ['buy', 'sell', 'hold', 'watch', 'note'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-100">{t('journal.addTitle')}</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('scanner.asset')}</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="input-field">
              <option value="">{t('portfolio.selectAsset')}</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('journal.type')}</label>
            <div className="flex flex-wrap gap-2">
              {entryTypes.map((type) => {
                const config = journalTypeConfig[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEntryType(type)}
                    className={cn(
                      'badge px-3 py-1.5 text-sm transition-all',
                      entryType === type
                        ? cn(config.bg, config.color, 'ring-1 ring-current')
                        : 'bg-surface-3 text-secondary-400'
                    )}
                  >
                    {t(config.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('journal.titleField')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder={t('journal.titlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('journal.content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder={t('journal.contentPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary-400 mb-1">{t('journal.emotion')}</label>
              <input
                type="text"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="input-field"
                placeholder={t('journal.emotionPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs text-secondary-400 mb-1">{t('journal.tags')}</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input-field"
                placeholder="FOMO, long-term"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('journal.rating')}</label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-1"
                >
                  <Star
                    className={cn('w-5 h-5 transition-colors', i < rating ? 'fill-warning-400 text-warning-400' : 'text-surface-4 hover:text-warning-400/50')}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button type="button" onClick={() => setRating(0)} className="text-xs text-secondary-500 ml-2 hover:text-error-400">
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-error-400">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              <Edit3 className="w-4 h-4" />
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
