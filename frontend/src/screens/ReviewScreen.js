import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import ItemCard from '../components/ItemCard';
import Button from '../components/Button';
import DuplicateReviewCard from '../components/DuplicateReviewCard';
import { getItem, deleteItem, dismissDuplicate } from '../api/items';
import { colors, layout, radii, spacing, type } from '../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const POLL_INTERVAL_MS = 1500;

export default function ReviewScreen({ route, navigation }) {
  const { itemIds } = route.params;
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(true);
  const [busyItemId, setBusyItemId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const results = await Promise.all(itemIds.map((id) => getItem(id)));
        if (cancelled) return;
        setItems(results);
        if (!results.some((item) => item.status === 'pending')) {
          setProcessing(false);
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        // Transient network hiccup while polling — next tick will retry.
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [itemIds]);

  const doneCount = items.filter((i) => i.status !== 'pending').length;
  const totalCount = itemIds.length;
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const needsReviewCount = items.filter((i) => i.status === 'needs_review').length;
  const duplicates = items.filter((i) => i.duplicateOfItemId);

  const handleKeepDuplicate = async (item) => {
    setBusyItemId(item._id);
    try {
      await dismissDuplicate(item._id);
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, duplicateOfItemId: null } : i)));
    } catch (err) {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteDuplicate = async (item) => {
    setBusyItemId(item._id);
    try {
      await deleteItem(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      Alert.alert('Could not delete', 'Please try again.');
    } finally {
      setBusyItemId(null);
    }
  };

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <Text style={styles.processingTitle}>Processing your closet…</Text>
        <Text style={styles.processingSubtitle}>
          Claude is classifying your items — {doneCount} of {totalCount} done
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review your items</Text>
        <Text style={styles.headerSubtitle}>
          {needsReviewCount > 0
            ? `${needsReviewCount} item${needsReviewCount === 1 ? '' : 's'} need a closer look — tap to fix.`
            : 'Tap any item to correct a tag.'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          duplicates.length > 0 ? (
            <View style={styles.duplicateSection}>
              <Text style={styles.duplicateTitle}>
                {duplicates.length === 1
                  ? 'This might be a duplicate'
                  : `${duplicates.length} of these might be duplicates`}
              </Text>
              <Text style={styles.duplicateSubtitle}>
                We found photos that look like items you already have. Your call:
              </Text>
              {duplicates.map((dup) => (
                <DuplicateReviewCard
                  key={dup._id}
                  item={dup}
                  imageBaseUrl={API_BASE_URL}
                  busy={busyItemId === dup._id}
                  onKeep={handleKeepDuplicate}
                  onDelete={handleDeleteDuplicate}
                />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            imageBaseUrl={API_BASE_URL}
            onPress={(i) => navigation.navigate('ItemDetail', { itemId: i._id })}
          />
        )}
      />

      <View style={styles.footer}>
        <Button label="Done" icon="checkmark" onPress={() => navigation.navigate('ClosetTab')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  processingTitle: { ...type.heading, color: colors.ink },
  processingSubtitle: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  progressTrack: {
    width: '80%',
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radii.pill },
  percentText: { ...type.label, color: colors.accent, marginTop: spacing.md },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerTitle: { ...type.title, color: colors.ink },
  headerSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  grid: { padding: spacing.md },
  row: { justifyContent: 'space-between' },
  duplicateSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  duplicateTitle: { ...type.heading, fontSize: 14, color: colors.warning },
  duplicateSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2, marginBottom: spacing.md },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
