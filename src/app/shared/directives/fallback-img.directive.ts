import { Directive, Input, HostListener, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[fallbackImg]',
  standalone: true,
})
export class FallbackImgDirective implements OnInit {
  @Input('fallbackImg') type: 'person' | 'company' | 'marca' | 'default' = 'default';

  @Input() fallbackSrc?: string;

  /** Los iconos 3D del diseño, en WebP: el busto gris de la plantilla parecía una imagen sin cargar. */
  private defaults: Record<string, string> = {
    person: './assets/images/iconos3d/perfil-natural.webp',
    company: './assets/images/iconos3d/perfil-juridico.webp',
    // `marca` es para lo que el cliente ve como enviado por Good Money, donde no debe aparecer la persona.
    marca: './assets/images/logos/icono.png',
    default: './assets/images/no-photo.png',
  };

  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    if (!img.src || img.src.trim() === '') {
      this.setFallback();
    }
  }

  @HostListener('error')
  onError(): void {
    this.setFallback();
  }

  private setFallback(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const fallback = this.fallbackSrc ?? this.defaults[this.type ?? 'default'];
    if (img.src !== fallback) {
      this.renderer.setAttribute(img, 'src', fallback);
    }
  }
}
