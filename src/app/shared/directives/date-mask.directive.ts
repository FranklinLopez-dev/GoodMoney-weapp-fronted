import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appDateMask]',
  standalone: true
})
export class DateMaskDirective {

  @Input() mode: 'date' | 'month' | 'time' = 'date';

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? 0;

    if (event.key === 'Backspace') {
      const separator = this.mode === 'time' ? ':' : '/';

      if (pos > 0 && input.value[pos - 1] === separator) {
        event.preventDefault();
        input.value =
          input.value.slice(0, pos - 2) +
          input.value.slice(pos);
        input.setSelectionRange(pos - 2, pos - 2);
      }
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '');

    let value = '';

    if (this.mode === 'time') {
      let hours = raw.slice(0, 2);
      let minutes = raw.slice(2, 4);

      if (hours.length === 2) {
        const h = Math.min(Number(hours), 23);
        hours = h.toString().padStart(2, '0');
      }

      if (minutes.length === 2) {
        const m = Math.min(Number(minutes), 59);
        minutes = m.toString().padStart(2, '0');
      }

      value = hours;

      if (hours.length === 2) {
        value += ':';
      }

      if (minutes) {
        value += minutes;
      }

      input.value = value;
      return;
    }

    if (this.mode === 'month') {
      let month = raw.slice(0, 2);
      let year = raw.slice(2, 6);

      if (month.length === 2) {
        const m = Math.min(Math.max(Number(month), 1), 12);
        month = m.toString().padStart(2, '0');
      }

      value = month;

      if (month.length === 2) {
        value += '/';
      }

      if (year) {
        value += year;
      }

      input.value = value;
      return;
    }

    let day = raw.slice(0, 2);
    let month = raw.slice(2, 4);
    let year = raw.slice(4, 8);

    if (day.length === 2) {
      const d = Math.min(Math.max(Number(day), 1), 31);
      day = d.toString().padStart(2, '0');
    }

    if (month.length === 2) {
      const m = Math.min(Math.max(Number(month), 1), 12);
      month = m.toString().padStart(2, '0');
    }

    value = day;

    if (day.length === 2) {
      value += '/';
    }

    if (month) {
      value += month;
      if (month.length === 2) {
        value += '/';
      }
    }

    if (year) {
      value += year;
    }

    input.value = value;
  }
}