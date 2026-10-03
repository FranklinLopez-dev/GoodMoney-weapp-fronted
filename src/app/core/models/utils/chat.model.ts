export interface Chats {
  id: number;
  nombre: string;
  conversationId: number;
  applicationUser: {
    id: string;
    email: string;
    userName: string;
    lockoutEnabled: boolean;
    names: string;
    isValidate: boolean;
    roles: {
      id: string;
      name: string;
      normalizedName: string;
      concurrencyStamp: string;
      isDefault: boolean;
    }[];
    socketId: string;
    typeOnline: string;
    emailConfirmed: boolean;
    profilesByValidate: number;
    photo: string;
  };
  message: Message;
  messages: Message[];
  photo: string;
  isReadByOtherParticipant: boolean;
  readDateByOtherParticipant: Date;
}

export interface ChatDTO {
    applicationUserId: string;
    nombre: string;
}

export interface MessageDTO {
    content: string;
    contentByte: any;
    isImage: boolean;
    applicationUserId: string;
    conversationId: number;
    fileName: string;
}

export interface Message {
    id: number;
    content: string;
    dateSend: Date;
    isImage: boolean;
    applicationUserId: string;
}

export interface ChatUnread {
  total: number;
  conversations: Chats[];
}