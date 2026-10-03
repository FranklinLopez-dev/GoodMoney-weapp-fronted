import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Notifications, NotificationDTO, NotificationsDTO } from 'src/app/core/models';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {

    private baseUrl = `${environment.apiUrl}/api/notifications`;

    constructor(private http: HttpClient, private _utilsService: UtilsService) { }

    search(
        searchTerm: string,
        status: number,
        pageIndex: number,
        pageSize: number
    ): Observable<HttpResponse<NotificationsDTO>> {
        const params = parametrosDePagina(pageIndex, pageSize);

        return this.http.get<NotificationsDTO>(`${this.baseUrl}/${status}/${searchTerm}`, {
            params,
            observe: 'response'
        });
    }

    /** Solo actualiza estado: la notificación de escritorio la dispara quien sabe que llegó algo nuevo. */
    getNotificationsNotRead() {
        return this.http
            .get<NotificationDTO>(`${this.baseUrl}/unread-summary`)
            .pipe(
                tap(response => {
                    this._utilsService.setNotificationsNotRead(response.notifications);
                    this._utilsService.setNumberNotificationsUnread(response.totalUnread);
                })
            );
    }


    public update(notifications: Notifications[]): Observable<any> {
        return this.http.put(`${this.baseUrl}`, notifications, { responseType: 'text' });
    }

    public delete(notifications: Notifications[]): Observable<any> {
        return this.http.request('delete', `${this.baseUrl}`, { body: notifications, responseType: 'text' });
    }

    requestPermission(): void {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                console.log('Permiso de notificación:', permission);
            });
        }
    }

    show(title: string, message: string): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: './assets/images/logos/logo-black.png',
            });
        }
    }

}
