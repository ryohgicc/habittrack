import type { QuadrantType } from '../types'

export interface WidgetTheme {
  isDark: boolean
  density: number
  scale: (value: number) => number
  px: (value: number) => string
  fonts: {
    sans: string
    mono: string
  }
  colors: {
    panel: string
    panelMuted: string
    panelSoft: string
    border: string
    borderStrong: string
    divider: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    textDisabled: string
    accent: string
    accentSoft: string
    accentText: string
    success: string
    successSoft: string
    successText: string
    danger: string
    dangerSoft: string
    dangerText: string
    warning: string
    warningSoft: string
    warningText: string
    neutralSoft: string
    neutralText: string
    input: string
    inputBorder: string
    inputFocus: string
    overlay: string
    overlayStrong: string
    icon: string
    iconMuted: string
    handleHover: string
  }
  radius: {
    sm: number
    md: number
    lg: number
    xl: number
    pill: number
  }
  shadow: {
    pill: string
    panel: string
    dialog: string
  }
  transition: string
  sizes: {
    header: number
    footer: number
    iconButton: number
    switchWidth: number
    switchHeight: number
  }
}

export interface QuadrantPalette {
  background: string
  headerBackground: string
  chipBackground: string
  chipText: string
  border: string
  addRowHover: string
  expandedBackground: string
  accent: string
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
const MONO_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

function createScaler(density: number) {
  return (value: number) => Math.round(value * density * 10) / 10
}

export function getWidgetTheme(isDark: boolean, density = 1): WidgetTheme {
  const scale = createScaler(density)
  const px = (value: number) => `${scale(value)}px`

  if (isDark) {
    return {
      isDark: true,
      density,
      scale,
      px,
      fonts: {
        sans: FONT_STACK,
        mono: MONO_STACK,
      },
      colors: {
        panel: '#111827',
        panelMuted: '#1f2937',
        panelSoft: '#0f172a',
        border: '#374151',
        borderStrong: '#4b5563',
        divider: '#334155',
        textPrimary: '#f3f4f6',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',
        textDisabled: '#6b7280',
        accent: '#60a5fa',
        accentSoft: 'rgba(59, 130, 246, 0.24)',
        accentText: '#dbeafe',
        success: '#4ade80',
        successSoft: 'rgba(34, 197, 94, 0.22)',
        successText: '#dcfce7',
        danger: '#f87171',
        dangerSoft: 'rgba(239, 68, 68, 0.22)',
        dangerText: '#fee2e2',
        warning: '#fbbf24',
        warningSoft: 'rgba(251, 191, 36, 0.2)',
        warningText: '#fef3c7',
        neutralSoft: 'rgba(148, 163, 184, 0.18)',
        neutralText: '#e5e7eb',
        input: '#0f172a',
        inputBorder: '#475569',
        inputFocus: '#60a5fa',
        overlay: 'rgba(2, 6, 23, 0.32)',
        overlayStrong: 'rgba(2, 6, 23, 0.54)',
        icon: '#d1d5db',
        iconMuted: '#9ca3af',
        handleHover: 'rgba(96, 165, 250, 0.18)',
      },
      radius: {
        sm: scale(8),
        md: scale(10),
        lg: scale(14),
        xl: scale(18),
        pill: 999,
      },
      shadow: {
        pill: '0 18px 32px rgba(2, 6, 23, 0.4)',
        panel: '0 28px 64px rgba(2, 6, 23, 0.5)',
        dialog: '0 24px 48px rgba(2, 6, 23, 0.52)',
      },
      transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
      sizes: {
        header: scale(52),
        footer: scale(44),
        iconButton: scale(28),
        switchWidth: scale(42),
        switchHeight: scale(22),
      },
    }
  }

  return {
    isDark: false,
    density,
    scale,
    px,
    fonts: {
      sans: FONT_STACK,
      mono: MONO_STACK,
    },
    colors: {
      panel: '#ffffff',
      panelMuted: '#f8fafc',
      panelSoft: '#f3f4f6',
      border: '#e5e7eb',
      borderStrong: '#d1d5db',
      divider: '#e2e8f0',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      textDisabled: '#9ca3af',
      accent: '#2563eb',
      accentSoft: 'rgba(37, 99, 235, 0.14)',
      accentText: '#1d4ed8',
      success: '#16a34a',
      successSoft: 'rgba(34, 197, 94, 0.15)',
      successText: '#15803d',
      danger: '#dc2626',
      dangerSoft: 'rgba(239, 68, 68, 0.14)',
      dangerText: '#b91c1c',
      warning: '#d97706',
      warningSoft: 'rgba(245, 158, 11, 0.16)',
      warningText: '#b45309',
      neutralSoft: 'rgba(148, 163, 184, 0.16)',
      neutralText: '#374151',
      input: '#ffffff',
      inputBorder: '#d1d5db',
      inputFocus: '#2563eb',
      overlay: 'rgba(15, 23, 42, 0.2)',
      overlayStrong: 'rgba(15, 23, 42, 0.34)',
      icon: '#4b5563',
      iconMuted: '#9ca3af',
      handleHover: 'rgba(37, 99, 235, 0.14)',
    },
    radius: {
      sm: scale(8),
      md: scale(10),
      lg: scale(14),
      xl: scale(18),
      pill: 999,
    },
    shadow: {
      pill: '0 16px 28px rgba(15, 23, 42, 0.16)',
      panel: '0 24px 56px rgba(15, 23, 42, 0.22)',
      dialog: '0 18px 42px rgba(15, 23, 42, 0.24)',
    },
    transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
    sizes: {
      header: scale(52),
      footer: scale(44),
      iconButton: scale(28),
      switchWidth: scale(42),
      switchHeight: scale(22),
    },
  }
}

export function getQuadrantPalette(
  theme: WidgetTheme,
  quadrant: QuadrantType
): QuadrantPalette {
  const palettes = theme.isDark
    ? {
        urgent_important: {
          background: 'rgba(127, 29, 29, 0.18)',
          headerBackground: 'rgba(248, 113, 113, 0.08)',
          chipBackground: 'rgba(248, 113, 113, 0.12)',
          chipText: '#fecaca',
          border: 'rgba(248, 113, 113, 0.18)',
          addRowHover: 'rgba(248, 113, 113, 0.08)',
          expandedBackground: 'rgba(127, 29, 29, 0.12)',
          accent: '#f87171',
        },
        important_not_urgent: {
          background: 'rgba(30, 64, 175, 0.18)',
          headerBackground: 'rgba(96, 165, 250, 0.08)',
          chipBackground: 'rgba(96, 165, 250, 0.12)',
          chipText: '#dbeafe',
          border: 'rgba(96, 165, 250, 0.18)',
          addRowHover: 'rgba(96, 165, 250, 0.08)',
          expandedBackground: 'rgba(30, 64, 175, 0.12)',
          accent: '#60a5fa',
        },
        urgent_not_important: {
          background: 'rgba(146, 64, 14, 0.18)',
          headerBackground: 'rgba(251, 191, 36, 0.08)',
          chipBackground: 'rgba(251, 191, 36, 0.12)',
          chipText: '#fde68a',
          border: 'rgba(251, 191, 36, 0.16)',
          addRowHover: 'rgba(251, 191, 36, 0.08)',
          expandedBackground: 'rgba(146, 64, 14, 0.12)',
          accent: '#fbbf24',
        },
        not_urgent_not_important: {
          background: 'rgba(71, 85, 105, 0.18)',
          headerBackground: 'rgba(148, 163, 184, 0.08)',
          chipBackground: 'rgba(148, 163, 184, 0.12)',
          chipText: '#e2e8f0',
          border: 'rgba(148, 163, 184, 0.16)',
          addRowHover: 'rgba(148, 163, 184, 0.08)',
          expandedBackground: 'rgba(71, 85, 105, 0.12)',
          accent: '#cbd5e1',
        },
      }
    : {
        urgent_important: {
          background: '#fef2f2',
          headerBackground: 'rgba(255, 255, 255, 0.7)',
          chipBackground: 'rgba(220, 38, 38, 0.08)',
          chipText: '#b91c1c',
          border: '#fecaca',
          addRowHover: 'rgba(220, 38, 38, 0.06)',
          expandedBackground: 'rgba(220, 38, 38, 0.04)',
          accent: '#dc2626',
        },
        important_not_urgent: {
          background: '#eff6ff',
          headerBackground: 'rgba(255, 255, 255, 0.72)',
          chipBackground: 'rgba(37, 99, 235, 0.08)',
          chipText: '#1d4ed8',
          border: '#bfdbfe',
          addRowHover: 'rgba(37, 99, 235, 0.06)',
          expandedBackground: 'rgba(37, 99, 235, 0.04)',
          accent: '#2563eb',
        },
        urgent_not_important: {
          background: '#fffbeb',
          headerBackground: 'rgba(255, 255, 255, 0.72)',
          chipBackground: 'rgba(245, 158, 11, 0.12)',
          chipText: '#b45309',
          border: '#fde68a',
          addRowHover: 'rgba(245, 158, 11, 0.08)',
          expandedBackground: 'rgba(245, 158, 11, 0.05)',
          accent: '#d97706',
        },
        not_urgent_not_important: {
          background: '#f8fafc',
          headerBackground: 'rgba(255, 255, 255, 0.72)',
          chipBackground: 'rgba(100, 116, 139, 0.1)',
          chipText: '#475569',
          border: '#e2e8f0',
          addRowHover: 'rgba(100, 116, 139, 0.06)',
          expandedBackground: 'rgba(148, 163, 184, 0.08)',
          accent: '#64748b',
        },
      }

  return palettes[quadrant]
}
