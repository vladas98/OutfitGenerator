import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../constants/theme';

/**
 * @param {'primary'|'secondary'|'danger'} [variant]
 * @param {'md'|'sm'} [size]
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = disabled || loading;
  const tint = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 14 : 17} color={tint} />}
          <Text style={[size === 'sm' ? styles.labelSm : styles.label, { color: tint }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  sizeMd: { paddingVertical: 15, paddingHorizontal: spacing.lg, minHeight: 50 },
  sizeSm: { paddingVertical: 8, paddingHorizontal: spacing.md, minHeight: 34 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { ...type.heading, fontSize: 15 },
  labelSm: { ...type.label, fontSize: 12 },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
  danger: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#EBC9C4' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
