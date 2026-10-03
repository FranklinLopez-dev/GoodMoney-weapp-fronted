import { Profile } from "../profiles/profile.model";

export interface Notifications {
    id: number;
    applicationUserId: string;
    message: string;
    dateCreation: Date;
    isRead: boolean;
    status: boolean;
    applicationUserRemiteId: string;
    applicationUserProfiles: Profile[];
    applicationUserRemiteProfiles: Profile[];
    photoRecibe: string;
    photoEnvia: string;
    nombresRecibe: string;
    nombresEnvia: string;
    type: string;
    operationId?: number | null;
}

export interface NotificationDTO {
  totalUnread: number;
  notifications: Notifications[];
}

export interface NotificationsDTO {
  totalUnread: number;
  totalRead: number;
  notifications: Notifications[];
}
