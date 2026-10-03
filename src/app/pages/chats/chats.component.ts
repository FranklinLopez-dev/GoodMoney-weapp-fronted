import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import {
  Component,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { PageEvent } from '@angular/material/paginator';
import { ChatsStore } from './chats.store';
import { ChatsService } from './chats.service';
import { environment } from 'src/environments/environment';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { MaterialModule } from 'src/app/material.module';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { ChatDTO, Chats, Message, Users } from 'src/app/core/models';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { ToastrService } from 'ngx-toastr';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

enum ChatViewMode {
  Chats = 'chats',
  NewChat = 'new-chat'
}

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, MaterialModule, NgScrollbarModule, FallbackImgDirective, TablerIconsModule],
  templateUrl: './chats.component.html',
  styles: [`
    .bg-light-primary {
      background-color: var(--mat-sys-primary-fixed-dim) !important;
    }
  `]
})
export class ChatsComponent {

  private store = inject(ChatsStore);
  private service = inject(ChatsService);
  public appData = inject(UtilsService);
  public authStore = inject(AuthStore);
  private toastr = inject(ToastrService);
  public readonly baseUrl = environment.apiUrl;
  readonly Permission = Permission;

  viewMode = signal<ChatViewMode>(ChatViewMode.Chats);
  searchTerm = signal('');
  messageText = signal('');
  sidePanelOpened = true;

  chats = this.store.chats;
  users = this.store.users;
  activeChat = this.store.activeChat;

  chatsTotal = this.store.chatsTotalRecords;
  chatsPageIndex = this.store.chatsPageIndex;
  chatsPageSize = this.store.chatsPageSize;

  usersTotal = this.store.usersTotalRecords;
  usersPageIndex = this.store.usersPageIndex;
  usersPageSize = this.store.usersPageSize;

  constructor() {
    toObservable(this.searchTerm)
        .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
        .subscribe(() => this.onSearch());
  }

  ngOnInit() {
    if (this.isOver()) this.sidePanelOpened = false;
  }

  isOver(): boolean {
    return window.matchMedia('(max-width: 960px)').matches;
  }

  loadData() {
    if (this.viewMode() === ChatViewMode.Chats) {
      this.loadChats();
    } else {
      this.loadUsers();
    }
  }

  loadChats() {
    this.service.search(
      this.searchTerm(),
      this.chatsPageIndex(),
      this.chatsPageSize()
    ).subscribe(res => {
      this.store.setChats(res.body ?? []);

      const totalRecords = totalDelEncabezado(res.headers);

      this.store.setChatsPagination(
        totalRecords,
        this.chatsPageIndex(),
        this.chatsPageSize()
      );
    });
  }

  loadUsers() {
    this.service.searchUsers(
      this.searchTerm(),
      this.usersPageIndex(),
      this.usersPageSize()
    ).subscribe(res => {
      this.store.setUsers(res.body ?? []);

      const totalRecords = totalDelEncabezado(res.headers);

      this.store.setUsersPagination(
        totalRecords,
        this.usersPageIndex(),
        this.usersPageSize()
      );
    });
  }

  toggleNewChat() {
    this.viewMode.set(
      this.viewMode() === ChatViewMode.Chats
        ? ChatViewMode.NewChat
        : ChatViewMode.Chats
    );

    this.searchTerm.set('');
  }

  onSearch() {
    this.store.setChatsPagination(this.chatsTotal(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    this.store.setUsersPagination(this.usersTotal(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    this.loadData();
  }

  onChatsPage(e: PageEvent) {
    this.store.setChatsPagination(this.chatsTotal(), e.pageIndex, e.pageSize);
    this.loadChats();
  }

  onUsersPage(e: PageEvent) {
    this.store.setUsersPagination(this.usersTotal(), e.pageIndex, e.pageSize);
    this.loadUsers();
  }

  openChat(user: Users) {
    const chat: ChatDTO = {
      applicationUserId: user.id,
      nombre: user.names
    };

    this.service.selectedChat(chat).subscribe({
      next: (serverChat: Chats) => {

        serverChat.conversationId = serverChat.id;
        serverChat.message =
          serverChat.messages?.[serverChat.messages.length - 1] ?? null;

        this.searchTerm.set('');
        this.viewMode.set(ChatViewMode.Chats);

        const chats = this.store.chats();

        const existing = chats?.find(c => c.conversationId === serverChat.id);

        let updatedChats: Chats[];

        if (!existing) {
          updatedChats = [serverChat, ...chats!];
          this.store.setChatsPagination(
            this.store.chatsTotalRecords() + 1,
            PAGINATION_CONFIG.DEFAULT_PAGE_INDEX,
            this.store.chatsPageSize()
          );
        } else {
          updatedChats = [
            {
              ...existing,
              ...serverChat
            },
            ...chats!.filter(c => c.conversationId !== serverChat.id)
          ];
        }

        this.store.setChats(updatedChats);
        this.store.setActiveChat(updatedChats[0]);
      }
    });
  }

  selectMessage(message: Chats): void {
    const chat: ChatDTO = {
      applicationUserId: message.applicationUser.id,
      nombre: message.applicationUser.names
    };

    this.service.selectedChat(chat).subscribe({
      next: (selected) => {
        this.viewMode.set(ChatViewMode.Chats);
        this.selectChat(selected);
      },
    });
  }

  selectChat(chat: Chats) {
    this.store.setActiveChat(chat);

    if (this.isOver()) {
      this.sidePanelOpened = false;
    }
  }

  deleteChat() {

    const active = this.activeChat();
    if (!active) return;

    active.conversationId = active.id;

    this.service.deleteChat(active).subscribe({
      next: () => {

        const chats = this.store.chats() ?? [];

        const updatedChats = chats.filter(
          c => c.conversationId !== active.id
        );

        this.store.setChats(updatedChats);

        const newTotal = this.store.chatsTotalRecords() - 1;
        this.store.setChatsPagination(
          Math.max(newTotal, 0),
          this.store.chatsPageIndex(),
          this.store.chatsPageSize()
        );

        this.store.clearActiveChat();

        if (
          updatedChats.length === 0 &&
          this.store.chatsPageIndex() > 0
        ) {
          this.store.setChatsPagination(
            newTotal,
            this.store.chatsPageIndex() - 1,
            this.store.chatsPageSize()
          );

          this.loadChats();
        }
      }
    });
  }

  uploadPhoto(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // El chat solo envia imagenes (el input declara accept="image/*"); se descarta cualquier otro tipo
      // en vez de mandarlo marcado como imagen. La validacion real sigue siendo del backend.
      if (!file.type.startsWith('image/')) {
        this.toastr.warning('Solo se permiten imágenes', 'Archivo no válido');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();

      let fileName = file.name;

      reader.readAsDataURL(file);

      reader.onload = (event: any) => {
        const base64Document = event.target.result;

        let fileByte = base64Document.replace(/^data:[\w\/\+]+;base64,/, '');

        this.sendMessage(fileByte, fileName);
      };
    }
  }

  sendMessage(photo: any, fileName?: string | null) {
    const active = this.activeChat();
    if (!active) return;

    const sendChat = {
      applicationUserId: active.applicationUser.id,
      content: this.messageText(),
      contentByte: photo,
      fileName,
      conversationId: active.id,
      isImage: !!photo,
    };

    this.service.sendMessage(sendChat as any).subscribe({
      next: (rs: Message) => {
        this.store.appendMessageToChat(active.id, rs);
        this.messageText.set('');
      }
    });
  }


  canDelete(): boolean {
    return this.authStore.hasPermission(Permission.UserIndex);
  }

}
