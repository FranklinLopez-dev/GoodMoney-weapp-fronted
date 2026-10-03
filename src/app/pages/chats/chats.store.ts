import { Injectable, computed, signal } from '@angular/core';
import { Chats, Message, Users } from 'src/app/core/models';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Injectable({ providedIn: 'root' })
export class ChatsStore {

  /* CHATS */
  private _chats = signal<Chats[] | null>(null);
  private _chatsLoading = signal(false);
  private _chatsTotalRecords = signal(0);
  private _chatsPageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  private _chatsPageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

  readonly chats = this._chats.asReadonly();
  readonly chatsLoading = this._chatsLoading.asReadonly();
  readonly chatsTotalRecords = this._chatsTotalRecords.asReadonly();
  readonly chatsPageIndex = this._chatsPageIndex.asReadonly();
  readonly chatsPageSize = this._chatsPageSize.asReadonly();

  hasChats = computed(() => !!this._chats()?.length);

  /* USERS */
  private _users = signal<Users[] | null>(null);
  private _usersLoading = signal(false);
  private _usersTotalRecords = signal(0);
  private _usersPageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  private _usersPageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

  readonly users = this._users.asReadonly();
  readonly usersLoading = this._usersLoading.asReadonly();
  readonly usersTotalRecords = this._usersTotalRecords.asReadonly();
  readonly usersPageIndex = this._usersPageIndex.asReadonly();
  readonly usersPageSize = this._usersPageSize.asReadonly();

  hasUsers = computed(() => !!this._users()?.length);

  /* SETTERS */
  setChats(items: Chats[]) {
    this._chats.set(items);
  }

  setChatsPagination(total: number, pageIndex: number, pageSize: number) {
    this._chatsTotalRecords.set(total);
    this._chatsPageIndex.set(pageIndex);
    this._chatsPageSize.set(pageSize);
  }

  setChatsLoading(value: boolean) {
    this._chatsLoading.set(value);
  }

  setUsers(items: Users[]) {
    this._users.set(items);
  }

  setUsersPagination(total: number, pageIndex: number, pageSize: number) {
    this._usersTotalRecords.set(total);
    this._usersPageIndex.set(pageIndex);
    this._usersPageSize.set(pageSize);
  }

  setUsersLoading(value: boolean) {
    this._usersLoading.set(value);
  }

  /* HELPERS */
  findChatById(id: number) {
    return computed(() =>
      this._chats()?.find(c => c.id === id) ?? null
    );
  }

  clearChats() {
    this._chats.set(null);
    this._chatsTotalRecords.set(0);
    this._chatsPageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
    this._chatsPageSize.set(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
  }

  clearUsers() {
    this._users.set(null);
    this._usersTotalRecords.set(0);
    this._usersPageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
    this._usersPageSize.set(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
  }

  clearAll() {
    this.clearChats();
    this.clearUsers();
    this.clearActiveChat();
  }

  private _activeChat = signal<Chats | null>(null);
  readonly activeChat = this._activeChat.asReadonly();

  setActiveChat(chat: Chats) {
    this._activeChat.set(chat);
  }

  clearActiveChat() {
    this._activeChat.set(null);
  }

  appendMessageToChat(chatId: number, message: Message) {

    const chats = this._chats();
    if (!chats || chats.length === 0) return;

    let updatedChat: Chats | null = null;
    const restChats: Chats[] = [];
    const active = this._activeChat();

    for (const chat of chats) {
      if (chat.conversationId === chatId) {

        const updatedMessages = [...(active?.messages ?? []), message];

        updatedChat = {
          ...chat,
          id: chat.conversationId, 
          message,
          messages: updatedMessages
        };

      } else {
        restChats.push(chat);
      }
    }

    const updatedChats = [updatedChat!, ...restChats];
    this._chats.set(updatedChats);
    this._activeChat.set(updatedChat);
  }

}
