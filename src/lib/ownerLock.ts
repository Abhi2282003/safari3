import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const IDLE_MS = 10 * 60 * 1000;
let unlockedAt: number | null = null;
let lastActivity = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function isUnlocked() {
  if (!unlockedAt) return false;
  if (Date.now() - lastActivity > IDLE_MS) {
    unlockedAt = null;
    return false;
  }
  return true;
}

if (typeof window !== 'undefined') {
  const touch = () => { if (unlockedAt) lastActivity = Date.now(); };
  ['click', 'keydown', 'touchstart', 'scroll'].forEach((e) => window.addEventListener(e, touch, { passive: true }));
  setInterval(() => { if (unlockedAt && !isUnlocked()) emit(); }, 30000);
}

export function lockOwner() {
  unlockedAt = null;
  emit();
}

export async function unlockOwner(password: string): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('verify_owner_password' as any, { _password: password });
  if (error) return { ok: false, message: error.message };
  const res = data as { ok: boolean; error?: string; locked_until?: string };
  if (res?.ok) {
    unlockedAt = Date.now();
    lastActivity = Date.now();
    emit();
    return { ok: true };
  }
  const map: Record<string, string> = {
    wrong: 'Incorrect password',
    locked: 'Too many wrong tries. Locked for 15 minutes.',
    not_admin: 'Only admin can open the Owner area',
    not_set: 'Owner password is not set',
  };
  return { ok: false, message: map[res?.error || ''] || 'Incorrect password' };
}

/** Verify the owner password once without unlocking the area (for one-off actions). */
export async function checkOwnerPassword(password: string) {
  const { data, error } = await supabase.rpc('verify_owner_password' as any, { _password: password });
  return !error && (data as any)?.ok === true;
}

export async function changeOwnerPassword(current: string, next: string) {
  const { data, error } = await supabase.rpc('set_owner_password' as any, { _current: current, _new: next });
  if (error) return { ok: false, message: error.message };
  const res = data as { ok: boolean; error?: string };
  if (res.ok) return { ok: true };
  return { ok: false, message: res.error === 'too_short' ? 'Use at least 6 characters' : res.error === 'locked' ? 'Locked for 15 minutes' : 'Current password is wrong' };
}

export function useOwnerUnlock() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { unlocked: isUnlocked(), lock: lockOwner };
}
