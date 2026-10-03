import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { forkJoin, map, catchError, of, finalize } from 'rxjs';
import { ChatsService } from './chats.service';
import { ChatsStore } from './chats.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Injectable({ providedIn: 'root' })
export class ChatsResolver implements Resolve<boolean> {

    private chatsService = inject(ChatsService);
    private store = inject(ChatsStore);

    resolve() {
        this.store.setChatsLoading(true);
        this.store.setUsersLoading(true);

        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;

        return forkJoin({
            chats: this.chatsService.search('', pageIndex, pageSize),
            users: this.chatsService.searchUsers('', pageIndex, pageSize)
        }).pipe(
            map(({ chats, users }) => {

                this.store.setChats(chats.body ?? []);

                const totalChats = totalDelEncabezado(chats.headers);

                this.store.setChatsPagination(
                    totalChats,
                    pageIndex,
                    pageSize
                );

                this.store.setUsers(users.body ?? []);

                const totalUsers = totalDelEncabezado(users.headers);

                this.store.setUsersPagination(
                    totalUsers,
                    pageIndex,
                    pageSize
                );

                return true;
            }),
            catchError(() => of(false)),
            finalize(() => {
                this.store.setChatsLoading(false);
                this.store.setUsersLoading(false);
            })
        );
    }
}
