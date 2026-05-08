import type { FaqItem } from './types';

export type Lang = 'en' | 'he';

export interface WidgetLabels {
  messagesCard: string;
  sendUsAMessage: string;
  helpSection: string;
  searchForHelp: string;
  noHelpArticles: string;
  noMatchingArticles: string;
  loadingConversations: string;
  conversationsError: string;
  noConversationsTitle: string;
  noConversationsBody: string;
  emptyCta: string;
  startConversationTitle: string;
  startConversationBody: string;
  howCanWeHelp: string;
  supportReplyTime: string;
  couldNotLoadMessages: string;
  supportUnavailable: string;
  typeMessage: string;
  send: string;
  back: string;
  close: string;
  openChat: string;
}

const EN: WidgetLabels = {
  messagesCard: 'Messages',
  sendUsAMessage: 'Send us a message',
  helpSection: 'Help',
  searchForHelp: 'Search for help',
  noHelpArticles: 'No help articles yet.',
  noMatchingArticles: 'No matching articles.',
  loadingConversations: 'Loading…',
  conversationsError: "Couldn't load conversations.",
  noConversationsTitle: 'No conversations yet',
  noConversationsBody:
    "Order chats appear here once you've placed or accepted a delivery.",
  emptyCta: 'Send us a message',
  startConversationTitle: 'Start the conversation',
  startConversationBody: 'Send a message to coordinate the delivery.',
  howCanWeHelp: 'How can we help?',
  supportReplyTime: 'Send us a message — we usually reply within a few minutes.',
  couldNotLoadMessages: "Couldn't load messages. Reload to retry.",
  supportUnavailable: 'Support is unavailable right now.',
  typeMessage: 'Type a message…',
  send: 'Send',
  back: 'Back',
  close: 'Close support',
  openChat: 'Open support chat',
};

const HE: WidgetLabels = {
  messagesCard: 'הודעות',
  sendUsAMessage: 'שלחו לנו הודעה',
  helpSection: 'עזרה',
  searchForHelp: 'חיפוש בעזרה',
  noHelpArticles: 'אין עדיין מאמרי עזרה.',
  noMatchingArticles: 'לא נמצאו מאמרים תואמים.',
  loadingConversations: 'טוען…',
  conversationsError: 'לא ניתן לטעון את השיחות.',
  noConversationsTitle: 'אין עדיין שיחות',
  noConversationsBody: 'צ׳אטים של הזמנות יופיעו כאן לאחר ביצוע או קבלת משלוח.',
  emptyCta: 'שלחו לנו הודעה',
  startConversationTitle: 'התחילו שיחה',
  startConversationBody: 'שלחו הודעה כדי לתאם את המשלוח.',
  howCanWeHelp: 'איך אפשר לעזור?',
  supportReplyTime: 'שלחו לנו הודעה — אנחנו בדרך כלל עונים תוך דקות.',
  couldNotLoadMessages: 'לא ניתן לטעון הודעות. רענון לניסיון נוסף.',
  supportUnavailable: 'התמיכה לא זמינה כרגע.',
  typeMessage: 'כתוב הודעה…',
  send: 'שלח',
  back: 'חזור',
  close: 'סגור תמיכה',
  openChat: 'פתח צ׳אט תמיכה',
};

export function getLabels(lang: Lang, overrides?: Partial<WidgetLabels>): WidgetLabels {
  const base = lang === 'he' ? HE : EN;
  return overrides ? { ...base, ...overrides } : base;
}

export const FAQ_CUSTOMER_EN: FaqItem[] = [
  {
    id: 'how-to-track',
    q: 'How do I track my order?',
    a: "Open the Orders tab and tap the order you'd like to track. You'll see live driver location and an estimated arrival time.",
  },
  {
    id: 'pricing',
    q: 'How is the price calculated?',
    a: 'Every delivery starts at a base of ₪20 plus a per-kilometre fee for the distance from pickup to drop-off. Tolls, surge during peak hours, and tips you choose to add are included separately on the receipt.',
  },
];

export const FAQ_CUSTOMER_HE: FaqItem[] = [
  {
    id: 'how-to-track',
    q: 'איך עוקבים אחרי ההזמנה?',
    a: 'פתחו את לשונית ההזמנות והקישו על ההזמנה הרצויה.',
  },
  {
    id: 'pricing',
    q: 'איך מחושב המחיר?',
    a: 'כל משלוח מתחיל במחיר בסיס של ₪20 בתוספת תעריף לקילומטר.',
  },
];

export function defaultFaq(lang: Lang): FaqItem[] {
  return lang === 'he' ? FAQ_CUSTOMER_HE : FAQ_CUSTOMER_EN;
}
