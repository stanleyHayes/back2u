export interface ChatThreadDTO {
  id: string;
  itemId: string;
  matchId?: string;
  participantIds: string[];
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessageDTO {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  flagged?: boolean;
  readBy?: string[];
  images?: { url: string }[];
}

export interface SendMessageInput {
  threadId: string;
  body: string;
  images?: { url: string }[];
}
