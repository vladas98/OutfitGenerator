import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_SWATCHES } from '../constants/options';
import { colors, radii, spacing, type } from '../constants/theme';

export default function ItemCard({ item, imageBaseUrl, onPress }) {
  const isPending = item.status === 'pending';
  const needsReview = item.status === 'needs_review';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(item)}
    >
      <Image source={{ uri: `${imageBaseUrl}${item.imageUrl}` }} style={styles.image} />

      {isPending && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Processing…</Text>
        </View>
      )}

      {needsReview && (
        <View style={styles.warningBadge}>
          <Ionicons name="alert-circle" size={15} color={colors.warning} />
        </View>
      )}

      {item.duplicateOfItemId && (
        <View style={styles.duplicateBadge}>
          <Ionicons name="copy-outline" size={13} color={colors.onAccent} />
        </View>
      )}

      {/* The swatch sits on the image so the caption below can use the full
          tile width — otherwise longer categories truncate in the 3-up grid. */}
      {item.status === 'classified' && item.colorFamily && (
        <View style={[styles.swatch, { backgroundColor: COLOR_SWATCHES[item.colorFamily] }]} />
      )}

      {item.status === 'classified' && (
        <View style={styles.tagRow}>
          <Text style={styles.tagText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {item.category}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31.5%',
    marginBottom: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,29,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { ...type.caption, fontWeight: '600', color: colors.onAccent },
  warningBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.pill,
    padding: 3,
  },
  duplicateBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    padding: 4,
  },
  tagRow: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    backgroundColor: colors.surfaceRaised,
  },
  swatch: {
    position: 'absolute',
    bottom: 32,
    left: 6,
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  tagText: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
});
