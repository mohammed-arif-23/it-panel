// Strict SaaS Color Palette - DO NOT MODIFY
export const colors = {
  primary: "#30343f",     // Dark blue-gray
  background: "#fafaff",  // Off-white background
  accent: "#e4d9ff",      // Light lavender
  secondary: "#273469",   // Medium blue
  dark: "#1e2749"        // Deep navy
} as const;

// Extended color variations for UI components
export const theme = {
  colors: {
    ...colors,
    // Text colors
    text: {
      primary: colors.primary,
      secondary: colors.secondary,
      muted: "#6b7280",
      white: "#ffffff"
    },
    // Border colors
    border: {
      light: colors.accent,
      medium: colors.secondary + "40", // 25% opacity
      dark: colors.primary
    },
    // State colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: colors.secondary
  },
  // Spacing scale
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem"
  },
  // Border radius
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem"
  },
  // Shadows
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
  }
} as const;

// CSS custom properties for dynamic theming
export const cssVariables = {
  '--color-primary': colors.primary,
  '--color-background': colors.background,
  '--color-accent': colors.accent,
  '--color-secondary': colors.secondary,
  '--color-dark': colors.dark,
  '--color-text-primary': colors.primary,
  '--color-text-secondary': colors.secondary,
  '--color-border-light': colors.accent,
  '--radius-md': theme.radius.md,
  '--radius-lg': theme.radius.lg,
  '--radius-xl': theme.radius.xl,
  '--radius-2xl': theme.radius["2xl"]
} as const;
