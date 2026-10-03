import { Directive, ElementRef, HostListener, inject, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

/** Al salir recorta y colapsa espacios dobles; con "all" no admite ninguno (correos). */
@Directive({
  selector: '[appTrim]',
  standalone: true
})
export class TrimDirective {

  @Input() appTrim: '' | 'all' = '';

  private el = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  private ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  alEscribir(): void {
    if (this.appTrim !== 'all') return;
    this.limpiar(valor => valor.replace(/\s+/g, ''));
  }

  @HostListener('blur')
  alSalir(): void {
    this.limpiar(valor => this.appTrim === 'all'
      ? valor.replace(/\s+/g, '')
      : valor.replace(/\s+/g, ' ').trim());
  }

  private limpiar(transformar: (valor: string) => string): void {
    const input = this.el.nativeElement;
    const limpio = transformar(input.value);

    if (limpio === input.value) return;

    input.value = limpio;
    this.ngControl?.control?.setValue(limpio);
  }
}
