import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Company, Dashboard, DataInitialResponse, Profile, Notifications, Chats } from '../../models';

@Injectable({
    providedIn: 'root'
})
export class UtilsService {

    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    private _profile = signal<Profile | null>(null);
    private _company = signal<Company | null>(null);
    private _numNotification = signal<number | null>(null);
    private _numImbox = signal<number | null>(null);
    private _notifications = signal<Notifications[] | null>(null);
    private _imboxs = signal<Chats[] | null>(null);
    private _loaded = signal(false);

    readonly profile = this._profile.asReadonly();
    readonly company = this._company.asReadonly();
    readonly numNotification = this._numNotification.asReadonly();
    readonly notifications = this._notifications.asReadonly();
    readonly numImbox = this._numImbox.asReadonly();
    readonly imboxs = this._imboxs.asReadonly();
    readonly loaded = this._loaded.asReadonly();

    getDataInitial() {
        this._loaded.set(true);
        return this.http
            .get<DataInitialResponse>(`${this.baseUrl}/api/utils/data-initial`)
            .pipe(
                tap((response) => {
                    const profileWithPhoto = {
                        ...response.profile,
                        profilePhoto: this.urlFoto(response.profile?.profilePhoto)
                    };
                    this._profile.set(profileWithPhoto);
                    this._company.set(response.company);
                    this._numNotification.set(response.numNotificationsUnread);
                    this._notifications.set(response.notifications);
                    this._numImbox.set(response.numChatsUnread);
                    this._imboxs.set(response.conversations);
                    this._loaded.set(false);
                })
            );
    }

    getDashboard(
        filterType: number,
        tabOperations: number,
        extraParams: Record<string, any> = {}
    ): Promise<Dashboard> {

        let params = new HttpParams()
            .set('filterType', filterType)
            .set('tabOperations', tabOperations);

        Object.entries(extraParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                params = params.set(key, value);
            }
        });

        return lastValueFrom(
            this.http.get<Dashboard>(
                `${this.baseUrl}/api/utils/dashboard`,
                { params }
            )
        );
    }

    setProfile(profile: Profile) {
        const profileWithPhoto = {
            ...profile,
            profilePhoto: this.urlFoto(profile?.profilePhoto)
        };

        this._profile.set(profileWithPhoto);
    }

    /** Vacío en vez de `<api>/null`: esa URL daba un 404 por cada vista. */
    private urlFoto(ruta: string | null | undefined): string {
        return ruta ? `${this.baseUrl}/${ruta}` : '';
    }

    setNotificationsNotRead(notifications: Notifications[]) {
        this._notifications.set(structuredClone(notifications));
    }

    setNumberNotificationsUnread(total: number) {
        this._numNotification.set(total);
    }

    setChatsNotRead(chats: Chats[]) {
        this._imboxs.set(structuredClone(chats));
    }

    setNumberChatsUnread(total: number) {
        this._numImbox.set(total);
    }


}