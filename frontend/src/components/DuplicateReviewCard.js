import { Image, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { colors, radii, spacing, type } from '../constants/theme';

/**
 * Shows a newly uploaded item beside the existing closet item it appears to
 * duplicate, and lets the user decide which to keep. Nothing is removed
 * automatically — the flag is only a suggestion.
 */
export default function DuplicateReviewCard({ item, imageBaseUrl, onKeep, onDelete, busy }) {
  const existing = item.duplicateOfItemId;

  return (
    <View style={styles.card}>
      <View style={styles.comparison}>
        <View style={styles.side}>
          <Text style={styles.sideLabel}>JUST ADDED</Text>
          <Image source={{ uri: `${imageBaseUrl}${item.imageUrl}` }} style={styles.image} resizeMode="contain" />
        </View>
        <Text style={styles.versus}>vs</Text>
        <View style={styles.side}>
          <Text style={styles.sideLabel}>IN CLOSET</Text>
          {existing?.imageUrl ? (
            <Image source={{ uri: `${imageBaseUrl}${existing.imageUrl}` }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, styles.imageMissing]} />
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Keep both"
          variant="secondary"
          size="sm"
          onPress={() => onKeep(item)}
          disabled={busy}
          style={styles.action}
        />
        <Button
          label="Remove new"
          variant="danger"
          size="sm"
          icon="trash-outline"
          onPress={() => onDelete(item)}
          loading={busy}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  comparison: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, alignItems: 'center' },
  sideLabel: { ...type.overline, fontSize: 9, color: colors.inkFaint, marginBottom: 6 },
  image: { width: '100%', aspectRatio: 1, borderRadius: radii.sm, backgroundColor: colors.surface },
  imageMissing: { backgroundColor: colors.border },
  versus: { ...type.caption, marginHorizontal: spacing.md, color: colors.inkFaint, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
