import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { moveGridFocus } from './keyboardNavigation';

describe('moveGridFocus', () => {
  it('moves focus within enabled buttons and leaves native activation keys alone', () => {
    const { getByText } = render(<div onKeyDown={(event) => moveGridFocus(event, 2)}>
      <button>one</button><button>two</button><button>three</button><button disabled>locked</button>
    </div>);
    const one = getByText('one');
    const two = getByText('two');
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(two);
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    two.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not prevent movement when there is no enabled target in that direction', () => {
    const { getByText } = render(<div onKeyDown={(event) => moveGridFocus(event, 2)}>
      <button>only</button><button disabled>locked</button>
    </div>);
    const only = getByText('only');
    only.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    only.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
