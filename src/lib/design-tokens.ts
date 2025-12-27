export const designTokens = {
  colors: {
    background: "var(--color-background)",
    foreground: "var(--color-foreground)",
    surface: "var(--surface-background)",
    border: "var(--surface-border)",
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    secondary: "hsl(var(--secondary))",
    secondaryForeground: "hsl(var(--secondary-foreground))",
    destructive: "hsl(var(--destructive))",
    destructiveForeground: "hsl(var(--destructive-foreground))",
    muted: "hsl(var(--muted))",
    mutedForeground: "hsl(var(--muted-foreground))",
    success: "hsl(var(--success))",
    successForeground: "hsl(var(--success-foreground))",
    info: "hsl(var(--info))",
    infoForeground: "hsl(var(--info-foreground))",
    warning: "hsl(var(--warning))",
  },
  spacing: {
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)",
    xxl: "var(--space-xxl)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
  },
  typography: {
    body: "1rem",
    heading: "1.75rem",
    subheading: "1.25rem",
    small: "0.875rem",
    caption: "0.75rem",
  },
  transitions: {
    gentle: "0.2s ease",
    smooth: "0.3s ease",
  },
} as const

export type DesignTokens = typeof designTokens
