/**
 * Theme contract for the RN widget. Consumers can pass a partial override
 * via the `theme` prop on <SupportWidget />; missing values fall back to
 * defaults (DEFAULT_LIGHT_THEME / DEFAULT_DARK_THEME).
 */
export interface WidgetTheme {
  primary: string;
  /** Optional 2+ color gradient used for the hero header background.
   *  When set, the chatbox header renders as an Intercom-style colored hero
   *  (logo + agent avatars + greeting). When omitted, header falls back to
   *  the flat minimal bar using `background` + `border`. */
  primaryGradient?: readonly string[];
  primaryText: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  bubbleSelf: string;
  bubbleSelfText: string;
  bubbleOther: string;
  bubbleOtherText: string;
  shadow: string;
}

export const DEFAULT_LIGHT_THEME: WidgetTheme = {
  primary: '#D40511',
  primaryText: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F5F5F7',
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B72',
  border: 'rgba(0,0,0,0.08)',
  bubbleSelf: '#D40511',
  bubbleSelfText: '#FFFFFF',
  bubbleOther: '#EFEFF1',
  bubbleOtherText: '#0A0A0A',
  shadow: '#000000',
};

export const DEFAULT_DARK_THEME: WidgetTheme = {
  primary: '#FF4D5C',
  primaryText: '#FFFFFF',
  background: '#0F0F12',
  surface: '#1C1C1F',
  textPrimary: '#F5F5F7',
  textSecondary: '#9C9CA3',
  border: 'rgba(255,255,255,0.10)',
  bubbleSelf: '#FF4D5C',
  bubbleSelfText: '#FFFFFF',
  bubbleOther: '#26262A',
  bubbleOtherText: '#F5F5F7',
  shadow: '#000000',
};

export function mergeTheme(base: WidgetTheme, override?: Partial<WidgetTheme>): WidgetTheme {
  return override ? { ...base, ...override } : base;
}
