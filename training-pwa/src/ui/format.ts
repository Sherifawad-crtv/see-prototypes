import { zonesLabel } from '../domain/court.ts';
import type { Amount, CartItem } from '../domain/types.ts';

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export function formatDurationClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec} s`;
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function amountLabel(amount: Amount): string {
  return amount.kind === 'count' ? plural(amount.n, 'shot') : 'Until the basket is empty';
}

export function modeBadgeText(item: CartItem): string {
  return item.mode === 'targeted' && item.zones?.length ? `Target: ${zonesLabel(item.zones)}` : 'Free';
}
