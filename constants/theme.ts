// constants/theme.ts
// Visual Novel Style - Warm Cinematic Palette (backwards compatible)

export const Colors = {
  // Core Backgrounds (Warm Charcoals)
  background: '#1A1512',
  surface: '#252019',
  surfaceElevated: '#2E2820',
  
  // Dialogue Box
  dialogueBackground: 'rgba(30, 25, 20, 0.95)',
  dialogueBorder: '#C17F59',
  
  // Borders (Warm Tones)
  border: '#3D352C',
  borderLight: '#2D2620',
  borderAccent: 'rgba(193, 127, 89, 0.4)',

  // In your Colors object, add:
  error: '#EF4444',
  
  // Text Hierarchy
  textPrimary: '#F5EDE5',
  textSecondary: '#BFB5A8',
  textMuted: '#8C8279',
  textWarm: '#E8D5C4',
  
  // Accent Colors (Sunset/Cinematic)
  accent: '#C17F59',
  accentBright: '#E89B6C',
  accentDim: 'rgba(193, 127, 89, 0.2)',
  accentMuted: 'rgba(193, 127, 89, 0.1)',
  
  // Nameplate
  nameplateBackground: '#C17F59',
  nameplateText: '#1A1512',
  
  // Status Colors
  streak: '#E89B6C',
  success: '#7FB069',
  active: '#6B9AC4',
  danger: '#C45B4A',
  
  // Completion States
  complete: '#7FB069',
  completeBorder: '#5D8A4C',
  incomplete: '#3D352C',
  
  // Button States
  buttonPrimary: '#C17F59',
  buttonPrimaryText: '#1A1512',
  buttonSecondary: '#2E2820',
  buttonSecondaryText: '#E8D5C4',
  
  // ===== BACKWARDS COMPATIBILITY ALIASES =====
  gold: '#C17F59',
  goldDim: 'rgba(193, 127, 89, 0.15)',
  goldMuted: 'rgba(193, 127, 89, 0.08)',
  borderGold: 'rgba(193, 127, 89, 0.3)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  card: 16,
  button: 12,
  dialogue: 4,
};

export const Typography = {
  headerLarge: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  headerMedium: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  headerSmall: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '500' as const,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  dataLarge: {
    fontSize: 48,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  dataMedium: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  dataSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  dialogueText: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  nameplate: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dialogue: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#C17F59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};