export interface FaqItem {
  id: string;
  q: string;
  a?: string;
  onClick?: () => void;
  category?: string;
}

export interface QuickLink {
  id: string;
  label: string;
  hint?: string;
  onClick: () => void;
}
