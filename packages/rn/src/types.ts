export interface FaqItem {
  id: string;
  q: string;
  /** Long-form answer shown when the row is tapped. Optional when `onPress` is set
   *  (the row becomes a navigation shortcut rather than an article). */
  a?: string;
  /** Tapped → run this instead of opening the answer article. Use it to
   *  deep-link to a specific screen (Documents, Bank, Vehicle, Delete account, etc.). */
  onPress?: () => void;
  category?: string;
}

/** Standalone navigation shortcut, separate from FAQ. */
export interface QuickLink {
  id: string;
  label: string;
  hint?: string;
  onPress: () => void;
}
