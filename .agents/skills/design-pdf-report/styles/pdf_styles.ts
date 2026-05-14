export const colors = {
  primary: '#1E40AF',
  secondary: '#F3F4F6',
  success: '#059669',
  danger: '#DC2626',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  h3: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  body: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#374151',
  },
  caption: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const createTableStyles = (theme = 'default') => {
  const baseStyles = {
    borderWidth: 1,
    borderColor: colors.border,
  };
  
  return baseStyles;
};