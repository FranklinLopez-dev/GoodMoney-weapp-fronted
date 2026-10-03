import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChildren } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, skip } from 'rxjs';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificationsService } from './notifications.service';
import { operationIdDeNotificacion, rutaDeNotificacion } from './notification-link';
import { NotificationsStore } from './notifications.store';
import { Notifications } from 'src/app/core/models';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './notifications.component.html',
  styles: [`
    .bg-light-primary {
      background-color: var(--mat-sys-primary-fixed-dim) !important;
    }
    /* Colores vivos del Figma de notificaciones; no hay token para ellos (--gm-rojo-500 es un rojo tinto de texto). */
    .badge-todos { background-color: #ffc107; }
    .badge-no-leidos { background-color: #ed1c24; }
    .badge-leidos { background-color: #72bf44; }
    .mat-mdc-checkbox {
      --mat-checkbox-selected-icon-color: var(--gm-color-marca-primario);
      --mat-checkbox-selected-hover-icon-color: var(--gm-color-marca-primario);
      --mat-checkbox-selected-focus-icon-color: var(--gm-color-marca-primario);
      --mat-checkbox-selected-hover-state-layer-color: var(--gm-color-marca-primario);
      --mat-checkbox-selected-focus-state-layer-color: var(--gm-color-marca-primario);
      --mat-checkbox-selected-pressed-state-layer-color: var(--gm-color-marca-primario);
    }
  `]
})
export class NotificationsComponent implements OnInit {

  private service = inject(NotificationsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);
  public store = inject(NotificationsStore);

  searchTerm = signal('');
  selectedCategory = signal(2);
  sidePanelOpened = signal(true);

  /** Llega desde el desplegable del header para resaltar la notificación pulsada. */
  readonly idDestacado = toSignal(
    this.route.queryParamMap.pipe(map(params => Number(params.get('id')) || null)),
    { initialValue: null }
  );
  private filas = viewChildren<ElementRef<HTMLElement>>('fila');
  private idEnfocado: number | null = null;

  pageSize = computed(() => this.store.pageSize());
  pageIndex = computed(() => this.store.pageIndex());
  length = computed(() => this.store.totalRecords());

  constructor() {
    toObservable(this.searchTerm)
        .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
        .subscribe(() => this.onSearch());

    // Desde el desplegable se pulsa una no leída: se abre ese filtro aunque ya se esté en la bandeja.
    toObservable(this.idDestacado)
        .pipe(skip(1), takeUntilDestroyed())
        .subscribe(id => {
          if (id && this.selectedCategory() !== 0) this.selectionlblClick(0);
        });

    effect(() => {
      const id = this.idDestacado();
      const fila = this.filas().find(f => f.nativeElement.id === `notificacion-${id}`);
      if (!id || !fila || id === this.idEnfocado) return;
      this.idEnfocado = id;
      fila.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  ngOnInit() {
    if (this.isOver()) this.sidePanelOpened.set(false);
    if (this.idDestacado()) this.selectedCategory.set(0);
    this.loadData();
  }

  isOver(): boolean {
    return window.matchMedia('(max-width: 960px)').matches;
  }

  loadData() {
    this.store.setLoading(true);

    this.service.search(
      this.searchTerm(),
      this.selectedCategory(),
      this.pageIndex(),
      this.pageSize()
    ).subscribe(res => {
      this.store.set(res.body!);

      const total = totalDelEncabezado(res.headers);

      this.store.setPagination(
        total,
        this.pageIndex(), this.pageSize()
      );

      this.store.setLoading(false);
    });
  }

  selectionlblClick(category: number) {
    this.selectedCategory.set(category);
    this.store.setPagination(
      this.length(),
      this.pageIndex(),
      this.pageSize()
    );
    this.loadData();
  }

  onSearch() {
    this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPagination(event.length, event.pageIndex, event.pageSize);
    this.loadData();
  }

  /* ACTIONS */

  /** Marca como leído y lleva al módulo donde está el movimiento. */
  abrirNotificacion(notification: Notifications): void {
    if (!notification.isRead) {
      this.service
        .update([{ ...notification, isRead: true }])
        .subscribe({ next: () => this.sincronizarHeader() });
    }
    const ruta = rutaDeNotificacion(
      notification,
      this.authStore.hasPermission(Permission.WebsIndex)
    );
    const operationId = operationIdDeNotificacion(notification);

    this.router.navigate(
      [ruta],
      operationId && ruta === '/operations'
        ? { queryParams: { operationId } }
        : undefined
    );
  }

  /** El globo y el dropdown del header listan las no leídas desde sus propias señales. */
  private sincronizarHeader(): void {
    this.service.getNotificationsNotRead().subscribe();
  }

  toggleSelectAll(event: MatCheckboxChange) {
    this.store.toggleSelectAll(event.checked);
  }

  toggleTodoCompletion(notification: Notifications) {
    this.store.toggleSelection(notification);
  }

  markAsRead() {
    this.store.markSelectedAsRead(true);
  }

  markAsUnread() {
    this.store.markSelectedAsRead(false);
  }

  deleteSelected() {
    this.store.removeSelected();
  }

  toggleReadAllStatus(read: boolean = true): void {

    const selected = this.store.getSelected();
    if (!selected.length) return;

    this.service
      .update(
        selected.map(n => ({
          ...n,
          isRead: !read
        }))
      )
      .subscribe({
        next: (rs: any) => {
          if (rs === 'OK') {
            this.loadData();
            this.sincronizarHeader();
          }
        }
      });
  }

  toggleReadStatus(notification: Notifications) {
    const payload = [notification];
    this.service.update(payload.map(n => ({
      ...n,
      isRead: !n.isRead
    }))).subscribe({
      next: (rs: any) => {
        if (rs == "OK") {
          this.loadData();
          this.sincronizarHeader();
        }
      },
    });
  }

  deleteNotificationAll(): void {
    const selected = this.store.getSelected();
    if (!selected.length) return;
    this.service.delete(selected).subscribe({
      next: (rs: any) => {
        if (rs == "OK") {
          this.loadData();
          this.sincronizarHeader();
        }
      },
    });
  }

  deleteNotification(notification: Notifications): void {
    const payload = [notification];
    this.service.delete(payload).subscribe({
      next: (rs: any) => {
        if (rs == "OK") {
          this.loadData();
          this.sincronizarHeader();
        }
      },
    });

  }

}
