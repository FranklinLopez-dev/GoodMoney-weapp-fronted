import { computed, Injectable, signal } from "@angular/core";
import { Notifications, NotificationsDTO } from "src/app/core/models";
import { PAGINATION_CONFIG } from "src/app/shared/config/pagination.config";

@Injectable({ providedIn: 'root' })
export class NotificationsStore {

  private _items = signal<NotificationsDTO | null>(null);
  private _loading = signal(false);
  private _totalRecords = signal(0);
  private _pageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  private _pageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  /* SETTERS */

  set(items: NotificationsDTO) {
    this._items.set(structuredClone(items));
  }

  setPagination(total: number, pageIndex: number, pageSize: number) {
    this._totalRecords.set(total);
    this._pageIndex.set(pageIndex);
    this._pageSize.set(pageSize);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  clear() {
    this._items.set(null);
    this._totalRecords.set(0);
    this._pageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
    this._pageSize.set(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
  }

  getSelected(): Notifications[] {
    return this._items()?.notifications.filter(n => n.status) ?? [];
  }

  /* UI HELPERS */

  toggleSelectAll(checked: boolean) {
    const items = this._items();
    if (!items) return;

    this._items.set({
      ...items,
      notifications: items.notifications.map((n: any) => ({
        ...n,
        status: checked
      }))
    });
  }

  toggleSelection(notification: Notifications) {
    const items = this._items();
    if (!items) return;

    this._items.set({
      ...items,
      notifications: items.notifications.map((n: any) =>
        n.id === notification.id
          ? { ...n, status: !n.status }
          : n
      )
    });
  }

  markSelectedAsRead(isRead: boolean) {
    const items = this._items();
    if (!items) return;

    this._items.set({
      ...items,
      notifications: items.notifications.map((n: any) =>
        n.status ? { ...n, isRead } : n
      ),
      totalRead: isRead
        ? items.totalRead + items.notifications.filter((n: any) => n.status).length
        : items.totalRead,
      totalUnread: !isRead
        ? items.totalUnread + items.notifications.filter((n: any) => n.status).length
        : items.totalUnread
    });
  }

  removeSelected() {
    const items = this._items();
    if (!items) return;

    const remaining = items.notifications.filter((n: any) => !n.status);

    this._items.set({
      ...items,
      notifications: remaining,
      totalRead: remaining.filter((n: any) => n.isRead).length,
      totalUnread: remaining.filter((n: any) => !n.isRead).length
    });
  }

  hasSelected = computed(() =>
    this._items()?.notifications.some((n: any) => n.status) ?? false
  );

  allSelected = computed(() =>
    this._items()?.notifications.every((n: any) => n.status) ?? false
  );
}
