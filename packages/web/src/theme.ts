/** Web theme contract — drop-in CSS-friendly colors. */
export interface WebWidgetTheme {
  primary: string;
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

export const DEFAULT_LIGHT_THEME: WebWidgetTheme = {
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
  shadow: 'rgba(0,0,0,0.18)',
};

export const DEFAULT_DARK_THEME: WebWidgetTheme = {
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
  shadow: 'rgba(0,0,0,0.4)',
};

export function mergeTheme(
  base: WebWidgetTheme,
  override?: Partial<WebWidgetTheme>,
): WebWidgetTheme {
  return override ? { ...base, ...override } : base;
}
