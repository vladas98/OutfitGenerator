import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getItem, updateItem, deleteItem } from '../api/items';
import {
  CATEGORIES,
  COLOR_FAMILIES,
  COLOR_SWATCHES,
  FORMALITY_LEVELS,
  SEASONS,
  SLEEVES,
  NECKLINES,
  HEMLINES,
  GARMENT_STYLES,
  FABRICS,
} from '../constants/options';
import { colors, layout, radii, spacing, type } from '../constants/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const prettify = (value) => value.replace(/_/g, ' ');

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // The fit attributes matter to the occasion rules but are rarely corrected,
  // so they start collapsed rather than burying the common fields.
  const [showFitDetails, setShowFitDetails] = useState(false);

  useEffect(() => {
    getItem(itemId)
      .then(setItem)
      .catch(() => setError('Could not load this item.'))
      .finally(() => setLoading(false));
  }, [itemId]);

  const applyField = async (field, value) => {
    setItem((prev) => ({ ...prev, [field]: value }));
    setSaving(true);
    try {
      setItem(await updateItem(itemId, { [field]: value }));
    } catch (err) {
      Alert.alert('Update failed', 'Could not save this change. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete item', 'Remove this item from your closet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(itemId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Delete failed', 'Could not delete this item. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color={colors.accent} />;
  if (error || !item) return <Text style={styles.errorText}>{error || 'Item not found.'}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: `${API_BASE_URL}${item.imageUrl}` }} style={styles.image} resizeMode="contain" />
        {saving && (
          <View style={styles.savingPill}>
            <ActivityIndicator size="small" color={colors.onAccent} />
            <Text style={styles.savingText}>Saving</Text>
          </View>
        )}
      </View>

      <Text style={styles.autosaveHint}>Tap a tag to change it — changes save immediately.</Text>

      <Button
        label="Build an outfit around this"
        icon="sparkles"
        onPress={() =>
          navigation.navigate('OutfitsTab', { screen: 'Outfit', params: { seedItemId: itemId } })
        }
        style={styles.buildButton}
      />

      <Section title="CATEGORY">
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={item.category === c} onPress={() => applyField('category', c)} />
        ))}
      </Section>

      <Section title="COLOR">
        {COLOR_FAMILIES.map((c) => (
          <Chip
            key={c}
            label={c}
            swatch={COLOR_SWATCHES[c]}
            selected={item.colorFamily === c}
            onPress={() => applyField('colorFamily', c)}
          />
        ))}
      </Section>

      <Section title="FORMALITY">
        {FORMALITY_LEVELS.map((f) => (
          <Chip
            key={f}
            label={prettify(f)}
            selected={item.formality === f}
            onPress={() => applyField('formality', f)}
          />
        ))}
      </Section>

      <Section title="SEASON">
        {SEASONS.map((s) => (
          <Chip
            key={s}
            label={prettify(s)}
            selected={item.season === s}
            onPress={() => applyField('season', s)}
          />
        ))}
      </Section>

      <Pressable style={styles.disclosure} onPress={() => setShowFitDetails((v) => !v)}>
        <View style={styles.disclosureText}>
          <Text style={styles.disclosureTitle}>Fit &amp; coverage</Text>
          <Text style={styles.disclosureSubtitle}>
            Used by occasion rules — e.g. no sleeveless tops for work
          </Text>
        </View>
        <Ionicons
          name={showFitDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkMuted}
        />
      </Pressable>

      {showFitDetails && (
        <>
          <Section title="SLEEVES">
            {SLEEVES.map((s) => (
              <Chip
                key={s}
                label={prettify(s)}
                selected={item.sleeves === s}
                onPress={() => applyField('sleeves', s)}
              />
            ))}
          </Section>

          <Section title="NECKLINE">
            {NECKLINES.map((n) => (
              <Chip
                key={n}
                label={prettify(n)}
                selected={item.neckline === n}
                onPress={() => applyField('neckline', n)}
              />
            ))}
          </Section>

          <Section title="HEMLINE">
            {HEMLINES.map((h) => (
              <Chip
                key={h}
                label={prettify(h)}
                selected={item.hemline === h}
                onPress={() => applyField('hemline', h)}
              />
            ))}
          </Section>

          <Section title="STYLE">
            {GARMENT_STYLES.map((g) => (
              <Chip
                key={g}
                label={prettify(g)}
                selected={item.garmentStyle === g}
                onPress={() => applyField('garmentStyle', g)}
              />
            ))}
          </Section>

          <Section title="FABRIC">
            {FABRICS.map((f) => (
              <Chip
                key={f}
                label={prettify(f)}
                selected={item.fabric === f}
                onPress={() => applyField('fabric', f)}
              />
            ))}
          </Section>
        </>
      )}

      <Button
        label="Done"
        icon="checkmark"
        onPress={() => navigation.goBack()}
        style={styles.doneButton}
      />

      <Button
        label="Delete this item"
        icon="trash-outline"
        variant="danger"
        onPress={handleDelete}
        style={styles.deleteButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageWrap: { position: 'relative' },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  savingPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31,29,26,0.8)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  savingText: { ...type.caption, color: colors.onAccent },
  autosaveHint: { ...type.caption, color: colors.inkFaint, marginTop: spacing.sm, textAlign: 'center' },
  buildButton: { marginTop: spacing.lg },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...type.overline, color: colors.inkMuted, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  disclosureText: { flex: 1 },
  disclosureTitle: { ...type.label, color: colors.ink },
  disclosureSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { textAlign: 'center', marginTop: spacing.xxl, color: colors.danger },
  doneButton: { marginTop: spacing.xxl },
  deleteButton: { marginTop: spacing.md },
});
