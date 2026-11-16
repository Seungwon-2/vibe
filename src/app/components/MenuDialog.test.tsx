import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuDialog } from './MenuDialog';

afterEach(cleanup);
const content = { titleId: 'records-title', title: '유저 랭킹', eyebrow: 'RECORDS', description: '계정별 최고 기록' };
describe('menu dialog navigation', () => {
  it('focuses close, traps Tab and lets Escape return to the originating menu', () => {
    const onBack = vi.fn();
    render(<MenuDialog {...content} onBack={onBack}><p>기록 목록</p></MenuDialog>);
    const close = screen.getByRole('button', { name: '닫기' });
    const back = screen.getByRole('button', { name: '← 타이틀로' });
    expect(close).toHaveFocus();
    back.focus();
    fireEvent.keyDown(back, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(back).toHaveFocus();
    fireEvent.keyDown(back, { key: 'Escape' });
    expect(onBack).toHaveBeenCalledOnce();
  });
  it('only dismisses backdrop clicks, leaving content interactions intact', () => {
    const onBack = vi.fn();
    const { container } = render(<MenuDialog {...content} onBack={onBack}><p>기록 목록</p></MenuDialog>);
    fireEvent.mouseDown(screen.getByText('기록 목록'));
    expect(onBack).not.toHaveBeenCalled();
    fireEvent.mouseDown(container.querySelector('.menu-dialog-screen')!);
    expect(onBack).toHaveBeenCalledOnce();
  });
  it('names the actual return destination and keeps secondary actions separate', () => {
    const onBack = vi.fn();
    render(<MenuDialog {...content} onBack={onBack} backLabel="← 캐릭터 선택으로"
      footerActions={<button>기록 더 보기</button>}><p>기록 목록</p></MenuDialog>);
    fireEvent.click(screen.getByRole('button', { name: '← 캐릭터 선택으로' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '기록 더 보기' })).toBeInTheDocument();
  });
});
