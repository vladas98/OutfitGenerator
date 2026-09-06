import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

export default function TextField({ label, error, style, ...inputProps }) {
  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.inkFaint}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { ...type.overline, color: colors.inkMuted, marginBottom: spacing.sm },
  input: {
    ...type.body,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    backgroundColor: colors.surfaceRaised,
  },
  inputError: { borderColor: colors.danger },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.xs },
});
