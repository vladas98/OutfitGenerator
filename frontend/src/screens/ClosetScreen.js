import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ItemCard from '../components/ItemCard';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import DuplicateReviewCard from '../components/DuplicateReviewCard';
import { listItems, deleteItem, dismissDuplicate } from '../api/items';
import { CATEGORIES, COLOR_FAMILIES, COLOR_SWATCHES } from '../constants/options';
import { colors, radii, spacing, type } from '../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ClosetScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);
  const [colorFamily, setColorFamily] = useState(null);
  const [error, setError] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await listItems({ category, colorFamily }));
    } catch (err) {
      setError('Could not load your closet. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, colorFamily]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const duplicates = items.filter((i) => i.duplicateOfItemId);
  const hasFilter = Boolean(category || colorFamily);

  // "All" is a full reset, not just a category choice — otherwise tapping it
  // while a color filter was active would still hide most of the closet.
  const clearFilters = () => {
    setCategory(null);
    setColorFamily(null);
  };

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

  return (
    <View style={styles.container}>
      {/* Filter bar. "All" is the reset — it clears both the category and the
          color filter, so one tap always returns the full closet. Horizontal
          scrolling keeps this to two compact rows rather than a wrapping wall
          of twenty chips. */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip label="All" selected={!hasFilter} onPress={clearFilters} />
          <View style={styles.separator} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onPress={() => setCategory(category === c ? null : c)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {COLOR_FAMILIES.map((c) => (
            <Chip
              key={c}
              label={c}
              swatch={COLOR_SWATCHES[c]}
              selected={colorFamily === c}
              onPress={() => setColorFamily(colorFamily === c ? null : c)}
            />
          ))}
        </ScrollView>

        {hasFilter && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterText}>
              {[category, colorFamily].filter(Boolean).join(' · ')}
              {!loading && ` — ${items.length} item${items.length === 1 ? '' : 's'}`}
            </Text>
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text style={styles.clearLink}>Clear</Text>
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" color={colors.accent} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon={hasFilter ? 'funnel-outline' : 'shirt-outline'}
          title={hasFilter ? 'Nothing matches' : 'Your closet is empty'}
          message={
            hasFilter
              ? 'Try clearing a filter to see more of your closet.'
              : 'Add a few photos of your clothes and they will show up here, tagged automatically.'
          }
          actionLabel={hasFilter ? 'Show all items' : 'Add items'}
          onAction={hasFilter ? clearFilters : () => navigation.navigate('AddTab')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListHeaderComponent={
            duplicates.length > 0 ? (
              <View style={styles.duplicateSection}>
                <Text style={styles.duplicateTitle}>
                  {duplicates.length === 1 ? '1 possible duplicate' : `${duplicates.length} possible duplicates`}
                </Text>
                <Text style={styles.duplicateSubtitle}>
                  These look like items you already have. Your call:
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterBar: {
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  activeFilterText: { ...type.caption, color: colors.inkMuted, textTransform: 'capitalize', flex: 1 },
  clearLink: { ...type.label, fontSize: 12, color: colors.accent },
  grid: { padding: spacing.md, paddingTop: spacing.sm },
  row: { justifyContent: 'space-between' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.danger,
    paddingHorizontal: spacing.xl,
  },
  duplicateSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  duplicateTitle: { ...type.heading, fontSize: 14, color: colors.warning },
  duplicateSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2, marginBottom: spacing.md },
});
