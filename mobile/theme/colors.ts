export const Colors = {
  background: '#FDFAF6',
  primary: '#6B2D3E',
  primaryLight: '#8B3D52',
  gold: '#C9A96E',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  surface: '#FFFFFF',
  border: '#E5E0D8',
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF3B30',
  shadow: 'rgba(107, 45, 62, 0.1)',
  info: '#007AFF',
  divider: '#F0EBE3',
  inputBackground: '#F7F3EE',
  placeholder: '#AEAEB2',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
