import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChatDTO, Chats, ChatUnread, Message, MessageDTO, Users } from 'src/app/core/models';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { environment } from 'src/environments/environment';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable({ providedIn: 'root' })
export class ChatsService {

    private baseUrl = `${environment.apiUrl}/api/chats`;

    constructor(private http: HttpClient, private _utilsService: UtilsService, private notification: NotificationsService) { }

    search(
        searchTerm: string,
        pageIndex: number,
        pageSize: number
    ): Observable<HttpResponse<Chats[]>> {
        const params = parametrosDePagina(pageIndex, pageSize);

        return this.http.get<Chats[]>(`${this.baseUrl}/${searchTerm}`, {
            params,
            observe: 'response'
        });
    }

    searchUsers(
        searchTerm: string,
        pageIndex: number,
        pageSize: number
    ): Observable<HttpResponse<Users[]>> {
        const params = parametrosDePagina(pageIndex, pageSize);

        return this.http.get<Users[]>(`${this.baseUrl}/users/${searchTerm}`, {
            params,
            observe: 'response'
        });
    }

    selectedChat(chat: ChatDTO) {
        return this.http.post<Chats>(`${this.baseUrl}`, chat, { responseType: 'json' });
    }

    deleteChat(chat: Chats): Observable<any> {
        return this.http.request('delete', `${this.baseUrl}`, { body: chat, responseType: 'text' });
    }

    sendMessage(chat: MessageDTO): Observable<any> {
        return this.http.post<Message>(`${this.baseUrl}/send-message`, chat, { responseType: 'json' });
    }

    getChatsNotRead() {
  return this.http
    // La URL iba doblada (baseUrl ya trae /api/chats): un 404 silencioso en cada aviso del socket.
    .get<ChatUnread>(`${this.baseUrl}/unread-summary`)
    .pipe(
      tap(response => {
        this._utilsService.setChatsNotRead(response.conversations);
        this._utilsService.setNumberChatsUnread(response.total);

        if (response.conversations?.length) {
          this.notification.show(
            response.conversations[0].applicationUser.names,
            response.conversations[0].message.content
          );
        }
      })
    );
}

}
