export type ChannelType = "FACEBOOK" | "INSTAGRAM" | "WHATSAPP" | "WIDGET";
export type SenderType = "CUSTOMER" | "AI" | "AGENT";
export type ConversationStatus = "ACTIVE" | "CLOSED" | "UNREPLIED" | "TICKET";

export interface MessageData {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderName: string;
  content: string;
  mediaUrl?: string | null;
  aiCostBdt: number;
  verifiedStock: boolean;
  createdAt: string | Date;
}

export interface ConversationData {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  channelType: ChannelType;
  status: ConversationStatus;
  aiHandled: boolean;
  lastMessageAt: string | Date;
  messages: MessageData[];
}
