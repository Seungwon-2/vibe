import type { KeyboardEvent } from 'react';

const ARROW_DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Move between visible buttons by their on-screen positions, including wrapped layouts and dialogs. */
export function moveDirectionalFocus(event: globalThis.KeyboardEvent): void {
  if (event.defaultPrevented) return;
  const direction = ARROW_DIRECTIONS[event.key];
  if (!direction || !(event.target instanceof Element)) return;

  // A modal owns keyboard navigation even while focus is still on a control behind it.
  // This matters for overlays (such as resume-session) that can appear without moving focus.
  const activeModal = Array.from(document.querySelectorAll<HTMLElement>(
    '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]',
  )).filter((modal) => {
    const style = window.getComputedStyle(modal);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }).at(-1) ?? null;
  const eventInsideModal = activeModal?.contains(event.target) ?? false;
  if (eventInsideModal && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (!activeModal && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

  const scope = activeModal
    ?? event.target.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]')
    ?? event.target.closest<HTMLElement>('main')
    ?? document.body;
  const buttons = Array.from(scope.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    .filter((button) => {
      const style = window.getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
  if (!buttons.length) return;

  const currentButton = event.target.closest<HTMLButtonElement>('button')
    ?? document.activeElement?.closest<HTMLButtonElement>('button')
    ?? null;
  if (!currentButton || !buttons.includes(currentButton)) {
    event.preventDefault();
    buttons[0].focus();
    return;
  }

  const current = currentButton.getBoundingClientRect();
  const currentX = current.left + current.width / 2;
  const currentY = current.top + current.height / 2;
  const [dx, dy] = direction;
  const next = buttons
    .filter((button) => button !== currentButton)
    .map((button) => {
      const rect = button.getBoundingClientRect();
      const offsetX = rect.left + rect.width / 2 - currentX;
      const offsetY = rect.top + rect.height / 2 - currentY;
      const primary = dx ? offsetX * dx : offsetY * dy;
      const cross = dx ? Math.abs(offsetY) : Math.abs(offsetX);
      return { button, primary, cross };
    })
    .filter(({ primary }) => primary > 0)
    .sort((a, b) => (a.primary + a.cross * 2) - (b.primary + b.cross * 2))[0]?.button;

  if (!next) return;
  event.preventDefault();
  next.focus();
}

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
