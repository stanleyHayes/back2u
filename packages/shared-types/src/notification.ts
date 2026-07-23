export type NotificationType = 'match' | 'message' | 'courier' | 'marketplace' | 'tag' | 'system';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  url?: string;
  read: boolean;
  createdAt: string;
}
