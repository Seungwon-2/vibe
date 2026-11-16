import { useEffect, useRef, type ReactNode } from 'react';
import './MenuDialog.css';

type MenuDialogProps = {
  titleId: string;
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  onBack(): void;
  backLabel?: string;
  footerActions?: ReactNode;
  bodyClassName?: string;
};

/** Consistent title-art backdrop, bounded content and navigation for menu popups. */
export function MenuDialog({ titleId, title, eyebrow, description, children, onBack,
  backLabel = '← 타이틀로', footerActions, bodyClassName = '' }: MenuDialogProps): React.JSX.Element {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeButton.current?.focus(); }, []);
  return <main className="menu-dialog-screen" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onBack();
  }}>
    <section className="menu-dialog-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}
      aria-describedby={`${titleId}-description`} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onBack(); }
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        )).filter((control) => !control.closest('[hidden]') && getComputedStyle(control).display !== 'none');
        const target = event.shiftKey ? controls.at(-1) : controls[0];
        if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) {
          event.preventDefault(); target?.focus();
        }
      }}>
      <header className="menu-dialog__header">
        <div><p className="eyebrow">{eyebrow}</p><h1 id={titleId}>{title}</h1></div>
        <button ref={closeButton} type="button" className="menu-dialog__close" onClick={onBack}>닫기 <span aria-hidden="true">×</span></button>
      </header>
      <p id={`${titleId}-description`} className="menu-dialog__description">{description}</p>
      <div className={`menu-dialog__body ${bodyClassName}`}>{children}</div>
      <footer className="menu-dialog__footer">
        <button type="button" className="menu-dialog__back" onClick={onBack}>{backLabel}</button>
        {footerActions && <div className="menu-dialog__actions">{footerActions}</div>}
      </footer>
    </section>
  </main>;
}
