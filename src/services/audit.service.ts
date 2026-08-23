import type { AuditAction } from '@/types';
import { supabase } from '@/lib/supabase';

export async function logAudit(
  userId: string | null,
  action: AuditAction,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    metadata,
  });

  if (error) {
    console.error('Failed to write audit log:', error.message);
  }
}
