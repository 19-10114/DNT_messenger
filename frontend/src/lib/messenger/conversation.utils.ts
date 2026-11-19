import { labelsMap } from '@/hooks/useMappedConstants';
import type { Conversation, MessengerUser } from '@/types/messenger.types';

export function userDisplayName(user?: MessengerUser): string {
  if (!user) return 'Usuario';
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username;
}

export function userSubtitle(
  user?: MessengerUser | Record<string, any>,
  branches?: { id: number; name: string }[]
): string {
  if (!user) return '';
  const roleRaw = user.role || '';
  const rol = (roleRaw ? labelsMap.roles[roleRaw.toLowerCase()] || roleRaw : '') || user.department || '';
  const branchId = user.branchId ?? (user as any).branch_id;
  const branchFromHook = branches?.find((b) => b.id === branchId)?.name;
  const sucursalNombre = (user.branchName ?? (user as any).branch_name ?? '').trim() || branchFromHook || '';
  const partes = [rol, sucursalNombre].filter(Boolean);
  return partes.length > 0 ? partes.join(' • ') : user.username || '';
}

export function conversationDisplayName(chat: Conversation): string {
  if (chat.type === 'group') return chat.name?.trim() || 'Grupo';
  return userDisplayName(chat.otherUser ?? chat.otherMember);
}

export function conversationInitials(chat: Conversation): string {
  const words = conversationDisplayName(chat).split(/\s+/).filter(Boolean);
  if (chat.type === 'group') return words[0]?.charAt(0).toUpperCase() || 'G';
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || 'US').slice(0, 2).toUpperCase();
}

export function conversationPreview(chat: Conversation): string {
  const message = chat.lastMessage;
  if (!message) return 'Sin mensajes';
  if (chat.type !== 'group') return message.content;

  const sender = message.sender;
  const firstInitial = sender.firstName?.trim().charAt(0);
  const lastName = sender.lastName?.trim();
  const senderName = [firstInitial ? `${firstInitial}.` : '', lastName]
    .filter(Boolean).join(' ') || sender.username || 'Empleado';

  return `${senderName}: ${message.content}`;
}

export function conversationActivity(chat: Conversation): number {
  const timestamps = [
    chat.lastMessageAt,
    chat.lastMessage?.createdAt,
    chat.updatedAt,
  ];
  return Math.max(0, ...timestamps.map((time) => {
    const parsed = time ? Date.parse(time) : NaN;
    return Number.isNaN(parsed) ? 0 : parsed;
  }));
}

export function conversationActivityDate(chat: Conversation): string {
  const times = [chat.lastMessageAt, chat.lastMessage?.createdAt, chat.updatedAt];
  const latest = conversationActivity(chat);
  return times.find((time) => time && Date.parse(time) === latest) || '';
}

export function sortConversations(chats: Conversation[]): Conversation[] {
  return [...chats].sort((left, right) =>
    conversationActivity(right) - conversationActivity(left) || left.id - right.id
  );
}

export function sameConversations(previous: Conversation[], next: Conversation[]): boolean {
  return previous.length === next.length && previous.every((chat, index) =>
    JSON.stringify(chat) === JSON.stringify(next[index])
  );
}

export function relativeActivityTime(date: string): string {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`;
  return new Date(parsed).toLocaleDateString('es-VE');
}

const READ_STORAGE_PREFIX = 'mc_last_read_';

export function getStoredReadTimestamps(userId?: number | null): Record<number, number> {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = localStorage.getItem(`${READ_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markConversationAsRead(conversationId: number, userId?: number | null): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const existing = getStoredReadTimestamps(userId);
    existing[conversationId] = Date.now();
    localStorage.setItem(`${READ_STORAGE_PREFIX}${userId}`, JSON.stringify(existing));
    window.dispatchEvent(new Event('mc_reads_updated'));
  } catch {
    // ignore
  }
}

export function isConversationUnread(
  chat: Conversation,
  currentUserId?: number | null,
  activeId?: number,
  reads?: Record<number, number>
): boolean {
  if (chat.id === activeId) return false;
  if ((chat.unreadCount ?? 0) > 0) return true;
  const lastMsg = chat.lastMessage;
  if (!lastMsg || !currentUserId) return false;
  if (lastMsg.sender?.id === currentUserId) return false;

  const msgTime = Date.parse(lastMsg.createdAt || chat.lastMessageAt || chat.updatedAt);
  if (Number.isNaN(msgTime)) return false;

  const readMap = reads ?? getStoredReadTimestamps(currentUserId);
  const lastRead = readMap[chat.id] ?? 0;
  return msgTime > lastRead;
}

export function countUnreadConversations(
  chats: Conversation[],
  currentUserId?: number | null,
  activeId?: number,
  reads?: Record<number, number>
): number {
  return chats.filter((c) => isConversationUnread(c, currentUserId, activeId, reads)).length;
}
