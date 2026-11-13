import type { KeyboardEvent } from 'react';

/** Move focus within a bounded button grid without capturing gameplay/form keys. */
export function moveGridFocus(event: KeyboardEvent<HTMLElement>, columns: number): void {
  const deltaByKey: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
  const delta = deltaByKey[event.key];
  if (delta === undefined) return;
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  const next = buttons[index + delta];
  if (index < 0 || !next) return;
  event.preventDefault();
  next.focus();
}
