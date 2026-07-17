export const colors = {
  background: "#F7F4EE",
  surface: "#FFFFFF",
  primary: "#245842",
  primaryDark: "#1B4433",
  textDark: "#102019",
  textSecondary: "#3E4B42",
  border: "#E5DED2",
  error: "#8B3A32",
  accent: "#D8CBB7",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: "800" as const, color: colors.textDark, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: "800" as const, color: colors.textDark, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: "700" as const, color: colors.textDark, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.textSecondary, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const, color: colors.textDark, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: "700" as const, color: colors.surface },
};

export const shadow = {
  shadowColor: "#102019",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
