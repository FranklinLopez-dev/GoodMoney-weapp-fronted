import {
  Directive,
  ElementRef,
  HostListener,
  forwardRef,
  Input
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Directive({
  selector: '[appAmountInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountInputDirective),
      multi: true,
    }
  ]
})
export class AmountInputDirective implements ControlValueAccessor {

  @Input() maxAmount?: number; // ej: 5000

  private input!: HTMLInputElement;
  private onChange = (_: number) => {};
  private onTouched = () => {};
  private cents = 0;

  constructor(el: ElementRef<HTMLInputElement>) {
    this.input = el.nativeElement;
    this.input.inputMode = 'numeric';
  }

  writeValue(value: number | null): void {
    this.cents = value ? Math.round(value * 100) : 0;
    this.render();
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.input.disabled = isDisabled;
  }


  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {

    if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    const hasSelection =
      this.input.selectionStart !== this.input.selectionEnd;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();

      this.cents = hasSelection
        ? 0
        : Math.floor(this.cents / 10);

      this.emit();
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const digit = Number(event.key);

    const next = hasSelection
      ? digit
      : this.cents * 10 + digit;

    if (this.isOverMax(next)) return;

    this.cents = next;
    this.emit();
  }


  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const text = event.clipboardData?.getData('text') ?? '';
    const normalized = text.replace(/[^\d.]/g, '');

    const value = Number(normalized);
    if (isNaN(value)) return;

    const cents = Math.round(value * 100);
    if (this.isOverMax(cents)) return;

    this.cents = cents;
    this.emit();
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
    this.render();
  }


  private emit(): void {
    this.onChange(this.cents / 100);
    this.render();
  }

  private render(): void {
    const value = this.cents / 100;
    this.input.value = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private isOverMax(nextCents: number): boolean {
    if (!this.maxAmount) return false;
    return nextCents / 100 > this.maxAmount;
  }
}
