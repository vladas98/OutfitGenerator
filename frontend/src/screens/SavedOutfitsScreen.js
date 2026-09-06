import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { alert } from '../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import { listSavedOutfits, unsaveOutfit, updateOutfitOccasion } from '../api/outfits';
import { OCCASIONS } from '../constants/options';
import { colors, layout, radii, shadow, spacing, type } from '../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const occasionLabel = (key) => OCCASIONS.find((o) => o.key === key)?.label || key;

export default function SavedOutfitsScreen({ navigation }) {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOutfits(await listSavedOutfits());
    } catch (err) {
      setError('Could not load your saved outfits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleDelete = (outfit) => {
    alert('Remove from saved', 'This only removes it from Saved — your clothes stay in your closet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(outfit._id);
          try {
            await unsaveOutfit(outfit._id);
            setOutfits((prev) => prev.filter((o) => o._id !== outfit._id));
          } catch (err) {
            alert('Could not remove', 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const handleRecategorize = async (outfit, nextOccasion) => {
    setBusyId(outfit._id);
    try {
      const updated = await updateOutfitOccasion(outfit._id, nextOccasion);
      setOutfits((prev) => prev.map((o) => (o._id === outfit._id ? { ...o, occasion: updated.occasion } : o)));
      setEditingId(null);
    } catch (err) {
      alert('Could not update', 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color={colors.accent} />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  if (outfits.length === 0) {
    return (
      <EmptyState
        icon="heart-outline"
        title="No saved outfits yet"
        message="Outfits you like are saved here automatically — tap Like on a suggestion."
        actionLabel="Generate an outfit"
        onAction={() => navigation.navigate('OutfitsTab')}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={outfits}
      keyExtractor={(o) => o._id}
      renderItem={({ item: outfit }) => {
        const isEditing = editingId === outfit._id;
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable
                style={styles.occasionBadge}
                onPress={() => setEditingId(isEditing ? null : outfit._id)}
              >
                <Text style={styles.occasionBadgeText}>{occasionLabel(outfit.occasion)}</Text>
                <Ionicons name={isEditing ? 'chevron-up' : 'chevron-down'} size={13} color={colors.accent} />
              </Pressable>
              <Pressable onPress={() => handleDelete(outfit)} disabled={busyId === outfit._id} hitSlop={8}>
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={busyId === outfit._id ? colors.inkFaint : colors.danger}
                />
              </Pressable>
            </View>

            {isEditing && (
              <View style={styles.recategorizeBox}>
                <Text style={styles.recategorizeLabel}>This outfit fits better as…</Text>
                {busyId === outfit._id ? (
                  <ActivityIndicator color={colors.accent} style={styles.spinner} />
                ) : (
                  <View style={styles.chipWrap}>
                    {OCCASIONS.filter((o) => o.key !== outfit.occasion).map((o) => (
                      <Chip key={o.key} label={o.label} onPress={() => handleRecategorize(outfit, o.key)} />
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.piecesRow}>
              {outfit.itemIds.map((item) => (
                <Image
                  key={item._id}
                  source={{ uri: `${API_BASE_URL}${item.imageUrl}` }}
                  style={styles.pieceImage}
                  resizeMode="contain"
                />
              ))}
            </View>

            <Text style={styles.reasoning}>{outfit.reasoning}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  list: { padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { textAlign: 'center', marginTop: spacing.xxl, color: colors.danger },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  occasionBadgeText: { ...type.label, fontSize: 11, color: colors.accentDeep },
  recategorizeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recategorizeLabel: { ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm },
  spinner: { alignSelf: 'flex-start', marginVertical: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  piecesRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pieceImage: { width: 84, height: 84, borderRadius: radii.md, backgroundColor: colors.surface },
  reasoning: { ...type.subtitleItalic, fontSize: 14, color: colors.inkMuted, marginTop: spacing.md },
});
