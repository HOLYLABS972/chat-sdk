/**
 * Built-in translations for the chat-sdk-rn widget UI.
 *
 * Languages: 'en' (default), 'he' (Hebrew, RTL).
 *
 * Consumers can override any string via the `labels` prop on <SupportWidget />.
 */
import type { FaqItem } from './types';

export type Lang = 'en' | 'he';

export interface WidgetLabels {
  // Landing
  messagesCard: string;
  sendUsAMessage: string;
  helpSection: string;
  searchForHelp: string;
  noHelpArticles: string;
  noMatchingArticles: string;
  // Conversations list
  loadingConversations: string;
  conversationsError: string;
  noConversationsTitle: string;
  noConversationsBody: string;
  emptyCta: string;
  // Order chat
  startConversationTitle: string;
  startConversationBody: string;
  // Support chat
  howCanWeHelp: string;
  supportReplyTime: string;
  couldNotLoadMessages: string;
  supportUnavailable: string;
  // Inputs
  typeMessage: string;
  send: string;
  // Header
  back: string;
  close: string;
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
  couldNotLoadMessages: "Couldn't load messages. Pull to retry.",
  supportUnavailable: 'Support is unavailable right now.',
  typeMessage: 'Type a message…',
  send: 'Send',
  back: 'Back',
  close: 'Close support',
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
  couldNotLoadMessages: 'לא ניתן לטעון הודעות. משכו לרענון.',
  supportUnavailable: 'התמיכה לא זמינה כרגע.',
  typeMessage: 'כתוב הודעה…',
  send: 'שלח',
  back: 'חזור',
  close: 'סגור תמיכה',
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
    id: 'change-address',
    q: 'Can I change the delivery address after ordering?',
    a: 'Once a driver has accepted, the address is locked. Cancel the order from the Order Details screen and create a new one if you need a different address.',
  },
  {
    id: 'refund',
    q: 'When will I get my refund?',
    a: 'Refunds typically appear on your card within 3–5 business days. If it has been longer, send us a message and we will check the status.',
  },
  {
    id: 'driver-late',
    q: 'My driver is late — what should I do?',
    a: "Open the order, tap the chat icon and message the driver directly. If you can't reach them, use Send us a message and we'll step in.",
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
    a: 'פתחו את לשונית ההזמנות והקישו על ההזמנה הרצויה. תראו את מיקום השליח בזמן אמת ואת שעת ההגעה המשוערת.',
  },
  {
    id: 'change-address',
    q: 'אפשר לשנות את כתובת המשלוח אחרי ביצוע ההזמנה?',
    a: 'ברגע שהשליח אישר את ההזמנה הכתובת נעולה. אפשר לבטל את ההזמנה במסך פרטי ההזמנה וליצור הזמנה חדשה אם צריך כתובת אחרת.',
  },
  {
    id: 'refund',
    q: 'מתי אקבל החזר?',
    a: 'החזרים מופיעים בכרטיס תוך 3–5 ימי עסקים בדרך כלל. אם עבר זמן רב יותר, שלחו לנו הודעה ונבדוק את הסטטוס.',
  },
  {
    id: 'driver-late',
    q: 'השליח מאחר — מה לעשות?',
    a: 'פתחו את ההזמנה, הקישו על אייקון הצ׳אט ושלחו הודעה ישירות לשליח. אם אין מענה — לחצו על "שלחו לנו הודעה" ונתערב.',
  },
  {
    id: 'pricing',
    q: 'איך מחושב המחיר?',
    a: 'כל משלוח מתחיל במחיר בסיס של ₪20 בתוספת תעריף לקילומטר על הדרך מנקודת האיסוף לכתובת המשלוח. אגרות, תוספת בשעות עומס וטיפים שתבחרו להוסיף מופיעים בנפרד בקבלה.',
  },
];

export const FAQ_DRIVER_EN: FaqItem[] = [
  {
    id: 'upload-documents',
    q: 'How do I upload my documents?',
    a: 'Open Profile → Documents. Tap each required document (driver licence, ID, vehicle insurance, etc.) and choose Take Photo or Pick from Library. Make sure all four corners are visible and the text is readable. Approval typically takes a few hours.',
  },
  {
    id: 'change-vehicle',
    q: 'How do I change my vehicle?',
    a: 'Go to Profile → Vehicle. Tap the current vehicle to edit details (make, model, plate) or use Switch Vehicle to swap to a different one you have already registered. New vehicles need to be approved before you can go online with them.',
  },
  {
    id: 'change-bank',
    q: 'How do I change my bank for payouts?',
    a: 'Go to Profile → Bank Account, tap Edit, and enter the new account details (bank, branch, account number). The change applies to your next withdrawal — past payouts already initiated continue to the old account.',
  },
  {
    id: 'documents-rejected',
    q: 'My documents were rejected — what now?',
    a: "Go to Profile → Documents and look for the red status. Tap the rejected document to see why support flagged it (blurry, expired, wrong type, etc.) and re-upload a clearer photo. You'll get a notification when it's reviewed again.",
  },
  {
    id: 'go-online',
    q: 'How do I go online to receive deliveries?',
    a: "On the home screen, slide the status switch at the bottom to Online. The switch only activates once your documents are approved, your vehicle is verified, and you've selected an operating city.",
  },
  {
    id: 'change-city',
    q: 'How do I change my operating city?',
    a: 'Open Profile → City. Pick a new city from the list and confirm. You can only be online in one city at a time — going online in a new city automatically takes you offline in the old one.',
  },
  {
    id: 'when-paid',
    q: 'When do I get paid for completed deliveries?',
    a: 'Earnings appear in your Wallet immediately after each delivery is marked complete. Withdrawals to your bank usually clear within 1–2 business days.',
  },
  {
    id: 'cancel-order',
    q: 'Can I cancel an accepted order?',
    a: "If you haven't picked up yet, decline from the order screen. After pickup the order can only be cancelled by the customer or support — message support from this widget if you need help.",
  },
  {
    id: 'tips',
    q: 'Do customers tip drivers?',
    a: 'Yes — customers can add a tip when they rate the delivery. Tips appear in your Wallet on top of base earnings, with no platform fee taken from them.',
  },
];

export const FAQ_DRIVER_HE: FaqItem[] = [
  {
    id: 'upload-documents',
    q: 'איך מעלים את המסמכים?',
    a: 'פתחו פרופיל ← מסמכים. הקישו על כל מסמך נדרש (רישיון נהיגה, תעודת זהות, ביטוח רכב וכו׳) ובחרו "צלם תמונה" או "בחר מהגלריה". ודאו שכל ארבע הפינות נראות ושהטקסט קריא. האישור לוקח בדרך כלל כמה שעות.',
  },
  {
    id: 'change-vehicle',
    q: 'איך מחליפים רכב?',
    a: 'פתחו פרופיל ← רכב. הקישו על הרכב הנוכחי לעריכת פרטים (יצרן, דגם, מספר רכב) או השתמשו ב"החלף רכב" כדי לעבור לרכב אחר שכבר רשמתם. רכב חדש צריך לעבור אישור לפני שניתן לעלות איתו.',
  },
  {
    id: 'change-bank',
    q: 'איך משנים חשבון בנק?',
    a: 'פתחו פרופיל ← חשבון בנק, הקישו על "ערוך" והזינו את פרטי החשבון החדשים (בנק, סניף, מספר חשבון). השינוי חל על המשיכה הבאה — תשלומים שכבר הוזמנו ימשיכו לחשבון הישן.',
  },
  {
    id: 'documents-rejected',
    q: 'המסמכים שלי נדחו — מה לעשות?',
    a: 'פתחו פרופיל ← מסמכים וחפשו את הסטטוס האדום. הקישו על המסמך הדחוי כדי לראות מדוע נדחה (טשטוש, פג תוקף, סוג שגוי וכו׳) והעלו תמונה ברורה יותר. תקבלו התראה כשהוא ייבדק שוב.',
  },
  {
    id: 'go-online',
    q: 'איך עוברים למצב מקוון לקבל משלוחים?',
    a: 'במסך הבית, הזיזו את מתג הסטטוס בתחתית למצב "מקוון". המתג מופעל רק לאחר שהמסמכים שלכם אושרו, הרכב אומת, ובחרתם עיר פעילה.',
  },
  {
    id: 'change-city',
    q: 'איך משנים עיר פעולה?',
    a: 'פתחו פרופיל ← עיר. בחרו עיר חדשה מהרשימה ואשרו. אפשר להיות מקוונים רק בעיר אחת בו זמנית — מעבר למצב מקוון בעיר חדשה מנתק אתכם אוטומטית מהקודמת.',
  },
  {
    id: 'when-paid',
    q: 'מתי מקבלים תשלום על משלוחים?',
    a: 'הרווחים נכנסים לארנק מיד לאחר סיום המשלוח. משיכות לחשבון בנק מסתיימות בדרך כלל תוך 1–2 ימי עסקים.',
  },
  {
    id: 'cancel-order',
    q: 'אפשר לבטל הזמנה שאישרתי?',
    a: 'אם עדיין לא אספתם — אפשר לדחות במסך ההזמנה. אחרי האיסוף, רק הלקוח או התמיכה יכולים לבטל — שלחו הודעה לתמיכה מהווידג׳ט הזה אם צריך עזרה.',
  },
  {
    id: 'tips',
    q: 'לקוחות נותנים טיפ לשליחים?',
    a: 'כן — לקוחות יכולים להוסיף טיפ כאשר הם מדרגים את המשלוח. טיפים מופיעים בארנק מעבר לתשלום הבסיס, ללא עמלת פלטפורמה.',
  },
];

export function defaultFaq(role: 'driver' | 'customer' | 'admin' | 'support', lang: Lang): FaqItem[] {
  if (role === 'driver') {
    return lang === 'he' ? FAQ_DRIVER_HE : FAQ_DRIVER_EN;
  }
  return lang === 'he' ? FAQ_CUSTOMER_HE : FAQ_CUSTOMER_EN;
}
