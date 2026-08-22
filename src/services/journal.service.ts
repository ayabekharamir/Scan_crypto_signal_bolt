import type { JournalEntry, JournalEntryType, Asset } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchJournalEntries(
  userId: string
): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, asset:assets(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as (JournalEntry & { asset: Asset })[];
}

export async function createJournalEntry(
  userId: string,
  assetId: string,
  entryType: JournalEntryType,
  title: string,
  content: string,
  emotion?: string,
  tags?: string[],
  rating?: number
): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      asset_id: assetId,
      entry_type: entryType,
      title,
      content,
      emotion: emotion || null,
      tags: tags || [],
      rating: rating || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntry;
}

export async function updateJournalEntry(
  id: string,
  updates: {
    entry_type?: JournalEntryType;
    title?: string;
    content?: string;
    emotion?: string | null;
    tags?: string[];
    rating?: number | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}

export const journalTypeConfig: Record<
  JournalEntryType,
  { labelKey: string; color: string; bg: string }
> = {
  buy: { labelKey: 'journal.types.buy', color: 'text-success-400', bg: 'bg-success-500/10' },
  sell: { labelKey: 'journal.types.sell', color: 'text-error-400', bg: 'bg-error-500/10' },
  hold: { labelKey: 'journal.types.hold', color: 'text-primary-300', bg: 'bg-primary-500/10' },
  watch: { labelKey: 'journal.types.watch', color: 'text-warning-300', bg: 'bg-warning-500/10' },
  note: { labelKey: 'journal.types.note', color: 'text-secondary-300', bg: 'bg-surface-3' },
};
