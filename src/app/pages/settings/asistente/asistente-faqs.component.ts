import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AsistenteFaq } from 'src/app/shared/components/asistente/asistente.service';
import { AsistenteFaqDialogComponent } from './asistente-faq-dialog.component';
import { AsistenteFaqsService } from './asistente-faqs.service';

/** Lo que se guarda aquí es lo que el asistente virtual ofrece y responde. */
@Component({
    selector: 'app-asistente-faqs',
    standalone: true,
    imports: [CommonModule, MaterialModule, TablerIconsModule],
    templateUrl: './asistente-faqs.component.html',
})
export class AsistenteFaqsComponent {

    private service = inject(AsistenteFaqsService);
    private dialog = inject(MatDialog);
    private snack = inject(MatSnackBar);

    faqs = signal<AsistenteFaq[]>([]);
    columnas = ['displayOrder', 'question', 'isActive', 'acciones'];

    constructor(route: ActivatedRoute) {
        this.faqs.set(this.ordenar(route.snapshot.data['preload'] ?? []));
    }

    nueva(): void {
        this.abrirDialogo(null);
    }

    editar(faq: AsistenteFaq): void {
        this.abrirDialogo(faq);
    }

    eliminar(faq: AsistenteFaq): void {
        if (!confirm(`¿Eliminar la pregunta "${faq.question}"?`)) return;
        this.service.delete(faq.id).subscribe({
            next: () => {
                this.faqs.update(f => f.filter(x => x.id !== faq.id));
                this.snack.open('Pregunta eliminada', 'OK', { duration: 2500 });
            },
            error: () => this.snack.open('No se pudo eliminar', 'OK', { duration: 3000 }),
        });
    }

    private abrirDialogo(faq: AsistenteFaq | null): void {
        this.dialog.open(AsistenteFaqDialogComponent, { data: { faq, existentes: this.faqs() }, width: '560px' })
            .afterClosed().subscribe(valores => {
                if (!valores) return;

                const peticion = faq
                    ? this.service.update(faq.id, valores)
                    : this.service.create(valores);

                peticion.subscribe({
                    next: () => this.recargar(faq ? 'Pregunta actualizada' : 'Pregunta creada'),
                    error: () => this.snack.open('No se pudo guardar', 'OK', { duration: 3000 }),
                });
            });
    }

    private recargar(mensaje: string): void {
        this.service.getAll().subscribe(faqs => {
            this.faqs.set(this.ordenar(faqs));
            this.snack.open(mensaje, 'OK', { duration: 2500 });
        });
    }

    private ordenar(faqs: AsistenteFaq[]): AsistenteFaq[] {
        return [...faqs].sort((a, b) => a.displayOrder - b.displayOrder);
    }
}
