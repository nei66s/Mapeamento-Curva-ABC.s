# Flat Design System Notes

## Tokens (single source of truth)

- **Colors**
  - `--color-background`, `--color-foreground` drive page canvas and primary text.
  - `--surface-background`, `--surface-border`, `--surface-foreground` keep every card/panel flat and consistent.
  - `--primary`, `--secondary`, `--destructive`, `--warning` follow the same 1px-border rule; status colors (success/info) live in `design-tokens.ts`.
- **Spacing & Radius**
  - `--space-*` and `--radius-*` define padding/margin steps; prefer `surface-highlight` or `surface-control` for single-variant containers.
  - `design-tokens.spacing` exposes `xs..xxl` for components that need runtime access (e.g., dynamic spacing in JS).
- **Typography**
  - Base scale defined (`body`, `heading`, `subheading`, `small`, `caption`) and reused across headers, hero stat text, etc.
  - `sr-only` with focus helpers ensures accessibility is not sacrificed for the flat look.
- **Transitions**
  - `--transition-gentle` and `--transition-smooth` keep hover/focus states soft and uniform.
  - Utility class `.flat-transition` can be applied to surfaces that animate between backgrounds or borders.

## Accessibility Improvements

- Added an explicit skip-link on `/auth/login` so assistive users skip straight to the form.
- Login errors now fire an `aria-live="assertive"` alert and the inputs remain grouped with descriptive labels.

## Performance Notes

- Key indicator widgets (`CallsChart`, `SlaChart`, `AgingChart`, `KpiAnalysis`, `ParetoAnalysis`) are now `next/dynamic`-loaded with `IndicatorsSkeleton` fallbacks to keep the initial paint lightweight.
- Consider lazy-loading other dashboard modules or splitting the API calls if new heavy panels are added.

## Next Steps

1. Surface Storybook or screenshot tests that render each `surface-*` class with the tokens above so regressions raise diffs.
2. Use `designTokens.typography` values for React components that need JS-driven sizing rather than hardcoded `text-*` utilities.
3. Keep any future shadows, gradients, or depth styles out of the repo unless there is a compelling reason; every new visual component should default to these flat helpers.
