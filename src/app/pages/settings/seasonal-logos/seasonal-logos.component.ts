import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { SeasonalLogo, SeasonalLogosService } from './seasonal-logos.service';
import { SeasonalLogoDialogComponent } from './seasonal-logo-dialog.component';

/** Cuál se muestra lo decide el API por fecha (`GET /api/companies/client`); aquí solo se activan. */
@Component({
    selector: 'app-seasonal-logos',
    standalone: true,
    imports: [CommonModule, MaterialModule, TablerIconsModule],
    templateUrl: './seasonal-logos.component.html',
})
export class SeasonalLogosComponent {

    private service = inject(SeasonalLogosService);
    private dialog = inject(MatDialog);
    private snack = inject(MatSnackBar);

    logos = signal<SeasonalLogo[]>([]);
    columnas = ['imagen', 'name', 'rango', 'isActive', 'acciones'];

    constructor(route: ActivatedRoute) {
        this.logos.set(route.snapshot.data['preload'] ?? []);
    }

    nuevo(): void {
        this.abrirDialogo(null);
    }

    editar(logo: SeasonalLogo): void {
        this.abrirDialogo(logo);
    }

    eliminar(logo: SeasonalLogo): void {
        if (!confirm(`¿Eliminar el logo "${logo.name}"?`)) return;
        this.service.delete(logo.id).subscribe({
            next: () => {
                this.logos.update(l => l.filter(x => x.id !== logo.id));
                this.snack.open('Logo eliminado', 'OK', { duration: 2500 });
            },
            error: () => this.snack.open('No se pudo eliminar', 'OK', { duration: 3000 }),
        });
    }

    private abrirDialogo(logo: SeasonalLogo | null): void {
        this.dialog.open(SeasonalLogoDialogComponent, { data: logo, width: '520px', maxWidth: '95vw' })
            .afterClosed().subscribe(valores => {
                if (!valores) return;

                const peticion = logo
                    ? this.service.update(logo.id, valores)
                    : this.service.create(valores);

                peticion.subscribe({
                    next: () => this.recargar(logo ? 'Logo actualizado' : 'Logo creado'),
                    error: () => this.snack.open('No se pudo guardar', 'OK', { duration: 3000 }),
                });
            });
    }

    private recargar(mensaje: string): void {
        this.service.getAll().subscribe(logos => {
            this.logos.set(logos);
            this.snack.open(mensaje, 'OK', { duration: 2500 });
        });
    }
}
