// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';
import { COLORS, SHADOW, SPACING } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 15,
    ...SHADOW,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    borderRadius: 10,
    marginBottom: SPACING.s,
    fontSize: 16,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});