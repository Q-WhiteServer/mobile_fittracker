// Palet warna & token desain bersama agar tampilan konsisten di seluruh layar.
import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  primary: '#0F766E',      // teal
  primaryDark: '#0B5A55',
  accent: '#0EA5E9',
  danger: '#B91C1C',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#15803D',
  warn: '#B45309',
};

export const typography = {
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.muted },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
};

export const controls = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.card,
    marginBottom: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  buttonTextOutline: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#FFF' },
});

export const screen = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  mt: { marginTop: 12 },
});
