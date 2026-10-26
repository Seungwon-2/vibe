export type RunnerAction = 'jump' | 'slide';

export type RunnerInputState = Readonly<{
  jumpPressed: boolean;
  slideHeld: boolean;
}>;

export class RunnerInputBridge {
  private jumpHeld = false;
  private jumpQueued = false;
  private slideHeld = false;

  press(action: RunnerAction): void {
    if (action === 'jump') {
      if (!this.jumpHeld) this.jumpQueued = true;
      this.jumpHeld = true;
    } else {
      this.slideHeld = true;
    }
  }

  release(action: RunnerAction): void {
    if (action === 'jump') this.jumpHeld = false;
    else this.slideHeld = false;
  }

  consumeFrame(): RunnerInputState {
    const frame = { jumpPressed: this.jumpQueued, slideHeld: this.slideHeld };
    this.jumpQueued = false;
    return frame;
  }

  clear(): void {
    this.jumpHeld = false;
    this.jumpQueued = false;
    this.slideHeld = false;
  }
}
