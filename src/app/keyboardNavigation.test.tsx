import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { moveDirectionalFocus, moveGridFocus } from './keyboardNavigation';

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

describe('moveDirectionalFocus', () => {
  it('navigates visible controls by their layout, even outside selection grids', () => {
    const { getByText } = render(<main onKeyDown={(event) => moveDirectionalFocus(event.nativeEvent)}>
      <button>start</button><button>records</button><button>settings</button>
    </main>);
    const start = getByText('start');
    const records = getByText('records');
    const settings = getByText('settings');
    const at = (button: HTMLElement, left: number, top: number): void => {
      button.getBoundingClientRect = () => ({
        x: left, y: top, left, top, right: left + 100, bottom: top + 40, width: 100, height: 40,
        toJSON: () => ({}),
      });
    };
    at(start, 0, 0);
    at(records, 120, 0);
    at(settings, 0, 60);
    start.focus();

    const focusWith = (target: HTMLElement, key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    };
    expect(focusWith(start, 'ArrowRight').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(records);
    focusWith(records, 'ArrowDown');
    expect(document.activeElement).toBe(settings);
  });

  it('keeps navigation within the open dialog and leaves form arrow keys alone', () => {
    const { getByText, getByRole } = render(<main onKeyDown={(event) => moveDirectionalFocus(event.nativeEvent)}>
      <button>outside</button>
      <section role="dialog"><button>first</button><button>second</button><input aria-label="volume" /></section>
    </main>);
    const outside = getByText('outside');
    const first = getByText('first');
    const second = getByText('second');
    const input = getByRole('textbox', { name: 'volume' });
    const at = (button: HTMLElement, left: number): void => {
      button.getBoundingClientRect = () => ({
        x: left, y: 0, left, top: 0, right: left + 100, bottom: 40, width: 100, height: 40,
        toJSON: () => ({}),
      });
    };
    at(outside, 0);
    at(first, 0);
    at(second, 120);

    first.focus();
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    first.dispatchEvent(right);
    expect(document.activeElement).toBe(second);
    const boundary = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    second.dispatchEvent(boundary);
    expect(boundary.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(second);

    input.focus();
    const inputArrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    input.dispatchEvent(inputArrow);
    expect(inputArrow.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('prioritizes an open modal when focus is still on a title-screen button behind it', () => {
    const { getByText } = render(<main onKeyDown={(event) => moveDirectionalFocus(event.nativeEvent)}>
      <button>title start</button>
      <section role="alertdialog" aria-modal="true">
        <button>resume</button><button>new run</button><button>close</button>
      </section>
    </main>);
    const titleStart = getByText('title start');
    const resume = getByText('resume');
    const newRun = getByText('new run');
    const close = getByText('close');
    const at = (button: HTMLElement, left: number): void => {
      button.getBoundingClientRect = () => ({
        x: left, y: 0, left, top: 0, right: left + 100, bottom: 40, width: 100, height: 40,
        toJSON: () => ({}),
      });
    };
    at(titleStart, 0);
    at(resume, 0);
    at(newRun, 120);
    at(close, 240);
    titleStart.focus();

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    titleStart.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(resume);

    const next = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    resume.dispatchEvent(next);
    expect(document.activeElement).toBe(newRun);
  });
});
