import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../components/Chip';
import Button from '../components/Button';
import { generateOutfit, updateOutfitOccasion } from '../api/outfits';
import { getItem } from '../api/items';
import { submitFeedback } from '../api/feedback';
import { OCCASIONS } from '../constants/options';
import { colors, layout, radii, shadow, spacing, type } from '../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const occasionLabel = (key) => OCCASIONS.find((o) => o.key === key)?.label || key;

export default function OutfitScreen({ route, navigation }) {
  const seedItemIdParam = route.params?.seedItemId;

  const [occasion, setOccasion] = useState(OCCASIONS[0].key);
  const [seedItem, setSeedItem] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replacingItemId, setReplacingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [recategorizing, setRecategorizing] = useState(false);
  const [savingOccasion, setSavingOccasion] = useState(false);

  // An item picked from the closet ("build an outfit around this") arrives as a
  // route param; load it so we can show which piece is locked in.
  useEffect(() => {
    if (!seedItemIdParam) return;
    getItem(seedItemIdParam).then(setSeedItem).catch(() => setSeedItem(null));
  }, [seedItemIdParam]);

  const runGeneration = async ({ seedItemIds, excludeItemIds, replacingId = null }) => {
    setLoading(true);
    setReplacingItemId(replacingId);
    setError(null);
    setFeedbackGiven(null);
    setRecategorizing(false);
    try {
      setOutfit(await generateOutfit(occasion, { seedItemIds, excludeItemIds }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not generate an outfit right now. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
      setReplacingItemId(null);
    }
  };

  const handleGenerate = () => {
    setOutfit(null);
    runGeneration({ seedItemIds: seedItem ? [seedItem._id] : [], excludeItemIds: [] });
  };

  // Keep every other piece, drop the one the user rejected, and rebuild.
  const handleReplace = (itemToReplace) => {
    const keep = outfit.itemIds.filter((i) => i._id !== itemToReplace._id).map((i) => i._id);
    runGeneration({
      seedItemIds: keep,
      excludeItemIds: [itemToReplace._id],
      replacingId: itemToReplace._id,
    });
  };

  const handleRecategorize = async (nextOccasion) => {
    setSavingOccasion(true);
    try {
      const updated = await updateOutfitOccasion(outfit._id, nextOccasion);
      setOutfit(updated);
      setRecategorizing(false);
    } catch (err) {
      setError('Could not change the occasion. Please try again.');
    } finally {
      setSavingOccasion(false);
    }
  };

  const handleFeedback = async (liked) => {
    if (!outfit) return;
    setFeedbackGiven(liked ? 'liked' : 'disliked');
    try {
      await submitFeedback(outfit._id, liked);
    } catch (err) {
      // Feedback is a nice-to-have signal; a failed submit shouldn't block the UI.
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {seedItem && (
        <View style={styles.seedBox}>
          <Image source={{ uri: `${API_BASE_URL}${seedItem.imageUrl}` }} style={styles.seedImage} resizeMode="contain" />
          <View style={styles.seedTextWrap}>
            <Text style={styles.seedLabel}>BUILDING AROUND</Text>
            <Text style={styles.seedValue}>
              {seedItem.colorFamily} {seedItem.category}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setSeedItem(null);
              navigation.setParams({ seedItemId: undefined });
            }}
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={22} color={colors.inkFaint} />
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionLabel}>WHAT'S THE OCCASION?</Text>
      <View style={styles.chipWrap}>
        {OCCASIONS.map((o) => (
          <Chip key={o.key} label={o.label} selected={occasion === o.key} onPress={() => setOccasion(o.key)} />
        ))}
      </View>

      <Button
        label={outfit ? 'Generate another' : 'Generate outfit'}
        icon="sparkles"
        onPress={handleGenerate}
        loading={loading && !replacingItemId}
        style={styles.generateButton}
      />

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {outfit && (
        <View style={styles.outfitCard}>
          <View style={styles.outfitHeader}>
            <View style={styles.occasionBadge}>
              <Text style={styles.occasionBadgeText}>{occasionLabel(outfit.occasion)}</Text>
            </View>
            <Pressable onPress={() => setRecategorizing((v) => !v)} hitSlop={8}>
              <Text style={styles.changeLink}>{recategorizing ? 'Cancel' : 'Change'}</Text>
            </Pressable>
          </View>

          {recategorizing && (
            <View style={styles.recategorizeBox}>
              <Text style={styles.recategorizeLabel}>This outfit fits better as…</Text>
              {savingOccasion ? (
                <ActivityIndicator color={colors.accent} style={styles.recategorizeSpinner} />
              ) : (
                <View style={styles.chipWrap}>
                  {OCCASIONS.filter((o) => o.key !== outfit.occasion).map((o) => (
                    <Chip key={o.key} label={o.label} onPress={() => handleRecategorize(o.key)} />
                  ))}
                </View>
              )}
            </View>
          )}

          <Text style={styles.piecesHint}>Tap Replace on any piece you don't like</Text>
          <View style={styles.piecesRow}>
            {outfit.itemIds.map((item) => (
              <View key={item._id} style={styles.piece}>
                <Image source={{ uri: `${API_BASE_URL}${item.imageUrl}` }} style={styles.pieceImage} resizeMode="contain" />
                <Text style={styles.pieceLabel} numberOfLines={1}>
                  {item.category}
                </Text>
                <Button
                  label="Replace"
                  variant="secondary"
                  size="sm"
                  icon="swap-horizontal"
                  onPress={() => handleReplace(item)}
                  loading={replacingItemId === item._id}
                  disabled={loading}
                  style={styles.replaceButton}
                />
              </View>
            ))}
          </View>

          <View style={styles.reasoningBox}>
            <Text style={styles.reasoningLabel}>WHY THIS WORKS</Text>
            <Text style={styles.reasoningText}>{outfit.reasoning}</Text>
          </View>

          <View style={styles.feedbackRow}>
            <Button
              label="Like"
              icon="heart"
              variant={feedbackGiven === 'liked' ? 'primary' : 'secondary'}
              onPress={() => handleFeedback(true)}
              disabled={feedbackGiven !== null}
              style={styles.feedbackButton}
            />
            <Button
              label="Not for me"
              icon="close"
              variant={feedbackGiven === 'disliked' ? 'primary' : 'secondary'}
              onPress={() => handleFeedback(false)}
              disabled={feedbackGiven !== null}
              style={styles.feedbackButton}
            />
          </View>
          {feedbackGiven === 'liked' && (
            <Text style={styles.feedbackNote}>Saved to your outfits.</Text>
          )}
          {feedbackGiven === 'disliked' && (
            <Text style={styles.feedbackNote}>Thanks — noted for next time.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  seedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  seedImage: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.border },
  seedTextWrap: { flex: 1 },
  seedLabel: { ...type.overline, fontSize: 10, color: colors.accent },
  seedValue: { ...type.label, color: colors.ink, textTransform: 'capitalize', marginTop: 1 },
  sectionLabel: { ...type.overline, color: colors.inkMuted, marginBottom: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  generateButton: { marginTop: spacing.xs },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { ...type.body, fontSize: 14, color: colors.danger, flex: 1, lineHeight: 19 },
  outfitCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  outfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  occasionBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  occasionBadgeText: { ...type.label, fontSize: 11, color: colors.accentDeep },
  changeLink: { ...type.label, fontSize: 13, color: colors.accent },
  recategorizeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recategorizeLabel: { ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm },
  recategorizeSpinner: { alignSelf: 'flex-start', marginVertical: spacing.sm },
  piecesHint: { ...type.caption, color: colors.inkFaint, marginBottom: spacing.md },
  piecesRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  piece: { alignItems: 'center', width: 96 },
  pieceImage: {
    width: 96,
    height: 96,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  pieceLabel: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  replaceButton: { marginTop: spacing.xs, alignSelf: 'stretch' },
  reasoningBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  reasoningLabel: { ...type.overline, fontSize: 10, color: colors.inkMuted },
  // Claude's explanation reads like a stylist's note — the italic serif gives
  // it a magazine-caption feel rather than plain UI copy.
  reasoningText: { ...type.subtitleItalic, color: colors.ink, marginTop: spacing.xs },
  feedbackRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  feedbackButton: { flex: 1 },
  feedbackNote: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.inkMuted,
  },
});
