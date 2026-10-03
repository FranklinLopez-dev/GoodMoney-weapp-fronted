import { Component, DestroyRef, Inject, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileItem } from '../../model/file.model';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FallbackImgDirective } from '../../directives/fallback-img.directive';
import { ArchivosPrivadosService } from '../../services/archivos-privados.service';

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_FACTOR = 1.25;

@Component({
  selector: 'app-file-viewer-dialog',
  imports: [MaterialModule, TablerIconsModule, FallbackImgDirective, DecimalPipe],
  standalone: true,
  templateUrl: './file-viewer-dialog.component.html',
  styles: [`
    .viewer-cerrar {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class FileViewerDialogComponent {

  safeUrl = signal<SafeResourceUrl | ''>('');

  /** Los adjuntos son fotos de documentos y a tamaño ajustado la letra no se lee; 1 = ajustada al modal. */
  zoom = signal(1);

  private arrastre: { x: number; y: number; left: number; top: number } | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FileItem,
    private sanitizer: DomSanitizer
  ) {
    // Una ruta `files/...` se pide con sesión y llega como `blob:`; las demás URLs pasan igual.
    // El bypass es necesario (iframe/img no aceptan una ResourceUrl sin marcar), pero se restringe el
    // esquema: los adjuntos reales son http(s)/blob/data, nunca `javascript:` u otro esquema activo.
    inject(ArchivosPrivadosService).url(data.url)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(url => this.safeUrl.set(esUrlDeArchivoSegura(url)
        ? this.sanitizer.bypassSecurityTrustResourceUrl(url!)
        : ''));
  }

  acercar(): void {
    this.zoom.set(Math.min(ZOOM_MAX, this.zoom() * ZOOM_FACTOR));
  }

  alejar(): void {
    this.zoom.set(Math.max(ZOOM_MIN, this.zoom() / ZOOM_FACTOR));
  }

  restablecer(): void {
    this.zoom.set(1);
  }

  alternarZoom(): void {
    this.zoom.set(this.zoom() === 1 ? 2 : 1);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    event.deltaY < 0 ? this.acercar() : this.alejar();
  }

  /* Arrastre para desplazarse con la imagen ampliada */

  iniciarArrastre(event: PointerEvent, area: HTMLElement): void {
    if (this.zoom() === 1) return;
    this.arrastre = {
      x: event.clientX,
      y: event.clientY,
      left: area.scrollLeft,
      top: area.scrollTop
    };
    area.setPointerCapture(event.pointerId);
  }

  moverArrastre(event: PointerEvent, area: HTMLElement): void {
    if (!this.arrastre) return;
    area.scrollLeft = this.arrastre.left - (event.clientX - this.arrastre.x);
    area.scrollTop = this.arrastre.top - (event.clientY - this.arrastre.y);
  }

  terminarArrastre(): void {
    this.arrastre = null;
  }
}

function esUrlDeArchivoSegura(url: string | null | undefined): boolean {
  return !!url && /^(https?:|blob:|data:)/i.test(url);
}
