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

/** A single support agent avatar shown in the hero header
 *  (Intercom-style "your team is online" cluster). */
export interface SupportAgent {
  /** Image source: remote URI string or a local require()'d module. */
  source: { uri: string } | number;
  /** Optional background color for the avatar circle (used as a halo
   *  behind transparent PNGs / emoji-style art). */
  bgColor?: string;
  /** Accessibility label / tooltip — typically the agent's name. */
  name?: string;
}

/** Brand identity for the chatbox header.
 *
 *  Minimal use: `{ name }` → flat header bar, current behavior.
 *  Hero use: pass `logo` and/or `agents` (combined with
 *  `theme.primaryGradient`) → Intercom-style colored hero header. */
export interface Brand {
  name: string;
  /** Big H1 shown inside the hero header (or above the cards in flat mode).
   *  E.g. "How can we help?". */
  greeting?: string;
  /** Small line above the greeting in hero mode. E.g. "Hi there 👋". */
  tagline?: string;
  /** Company logo shown at the top-left of the hero header.
   *  Image source: remote URI string or a local require()'d module. */
  logo?: { uri: string } | number;
  /** Up to ~4 support agent avatars stacked at the top-right of the hero header. */
  agents?: SupportAgent[];
}
