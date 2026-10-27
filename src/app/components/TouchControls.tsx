import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import type { RunnerAction, RunnerInputBridge } from '../../game/runner/RunnerInput';

export function TouchControls({ inputBridge, disabled }: {
  inputBridge: RunnerInputBridge;
  disabled: boolean;
}): React.JSX.Element {
  const [pressed, setPressed] = useState<RunnerAction | null>(null);

  useEffect(() => {
    if (disabled) inputBridge.clear();
    return () => inputBridge.clear();
  }, [disabled, inputBridge]);

  function press(action: RunnerAction, event: PointerEvent<HTMLButtonElement>): void {
    if (disabled) return;
    event.preventDefault();
    inputBridge.press(action);
    setPressed(action);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function release(action: RunnerAction): void {
    inputBridge.release(action);
    setPressed((current) => current === action ? null : current);
  }

  function control(action: RunnerAction, label: string, icon: string): React.JSX.Element {
    return (
      <button className={`runner-touch-control runner-touch-control--${action}${pressed === action && !disabled ? ' is-pressed' : ''}`}
        type="button" aria-label={label} aria-pressed={pressed === action && !disabled} disabled={disabled}
        onPointerDown={(event) => press(action, event)}
        onPointerUp={() => release(action)}
        onPointerCancel={() => release(action)}
        onLostPointerCapture={() => release(action)}
        onPointerLeave={() => release(action)}>
        <span aria-hidden="true">{icon}</span><strong>{label}</strong>
      </button>
    );
  }

  return <div className="runner-touch-controls" aria-label="터치 조작">
    {control('jump', '점프', '↑')}
    {control('slide', '슬라이딩', '↓')}
  </div>;
}
