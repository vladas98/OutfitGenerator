import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

/**
 * @param {string} [swatch] - optional color dot, used by the closet color filter
 */
export default function Chip({ label, selected, onPress, swatch }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      {swatch && (
        <View
          style={[
            styles.swatch,
            { backgroundColor: swatch },
            selected && styles.swatchSelected,
          ]}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    // Without this, chips get squeezed inside a horizontal ScrollView and
    // longer labels ("outerwear", "accessory") are truncated mid-word.
    flexShrink: 0,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { opacity: 0.75 },
  swatch: {
    width: 11,
    height: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  swatchSelected: { borderColor: 'rgba(255,255,255,0.6)' },
  label: {
    ...type.label,
    fontWeight: '500',
    color: colors.inkMuted,
    flexShrink: 0,
  },
  labelSelected: { color: colors.onAccent, fontWeight: '700' },
});
