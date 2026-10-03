import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appInputMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputMaskDirective),
      multi: true
    }
  ]
})
export class InputMaskDirective
  implements ControlValueAccessor, OnChanges {

  @Input() appInputMask: 'numeric' | 'text' = 'text';
  @Input() maxLengthValue = 0;

  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };
  private disabled = false;

  constructor(private el: ElementRef<HTMLInputElement>) { }

  writeValue(value: any): void {
    const input = this.el.nativeElement;
    input.value = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.el.nativeElement.disabled = isDisabled;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const input = this.el.nativeElement;

    input.type = 'text';
    input.inputMode = this.appInputMask === 'numeric' ? 'numeric' : 'text';

    if (this.maxLengthValue > 0) {
      input.maxLength = this.maxLengthValue;
    } else {
      input.removeAttribute('maxlength');
    }
  }

  @HostListener('input')
  onInput() {
    if (this.disabled) return;

    const input = this.el.nativeElement;
    let value = input.value;

    if (this.appInputMask === 'numeric') {
      value = value.replace(/\D+/g, '');
    }

    if (this.maxLengthValue > 0 && value.length > this.maxLengthValue) {
      value = value.slice(0, this.maxLengthValue);
    }

    if (value !== input.value) {
      input.value = value;
    }

    this.onChange(value);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.disabled || this.appInputMask !== 'numeric') return;

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab'
    ];

    if (allowedKeys.includes(event.key)) return;

    const input = this.el.nativeElement;
    const hasSelection = input.selectionStart !== input.selectionEnd;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (
      this.maxLengthValue > 0 &&
      input.value.length >= this.maxLengthValue &&
      !hasSelection
    ) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (this.disabled) return;

    event.preventDefault();

    const text = event.clipboardData?.getData('text') ?? '';
    let value = text;

    if (this.appInputMask === 'numeric') {
      value = value.replace(/\D+/g, '');
    }

    if (this.maxLengthValue > 0) {
      value = value.slice(0, this.maxLengthValue);
    }

    this.el.nativeElement.value = value;
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
  }
}