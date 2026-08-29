import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listItems } from '../api/items';
import { listSavedOutfits } from '../api/outfits';
import { colors, radii, shadow, spacing, type } from '../constants/theme';

function ActionCard({ icon, title, subtitle, onPress, primary }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        primary && styles.cardPrimary,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.cardIcon, primary && styles.cardIconPrimary]}>
        <Ionicons name={icon} size={21} color={primary ? colors.onAccent : colors.accent} />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, primary && styles.cardTitlePrimary]}>{title}</Text>
        <Text style={[styles.cardSubtitle, primary && styles.cardSubtitlePrimary]}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={primary ? 'rgba(255,255,255,0.6)' : colors.inkFaint}
      />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ items: null, saved: null });

  useFocusEffect(
    useCallback(() => {
      Promise.all([listItems(), listSavedOutfits()])
        .then(([items, saved]) => setStats({ items: items.length, saved: saved.length }))
        .catch(() => setStats({ items: null, saved: null }));
    }, [])
  );

  const countLabel = (n, singular) =>
    n === null ? '—' : `${n} ${n === 1 ? singular : `${singular}s`}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Your closet</Text>
      <Text style={styles.tagline}>AI-powered outfits, styled from what you already own.</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.items ?? '—'}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.saved ?? '—'}</Text>
          <Text style={styles.statLabel}>Saved outfits</Text>
        </View>
      </View>

      <ActionCard
        primary
        icon="sparkles"
        title="Generate an outfit"
        subtitle="Pick an occasion and get a styled look"
        onPress={() => navigation.navigate('OutfitsTab')}
      />
      <ActionCard
        icon="camera-outline"
        title="Add items"
        subtitle="Photograph clothes to build your closet"
        onPress={() => navigation.navigate('AddTab')}
      />
      <ActionCard
        icon="grid-outline"
        title="My closet"
        subtitle={countLabel(stats.items, 'item')}
        onPress={() => navigation.navigate('ClosetTab')}
      />
      <ActionCard
        icon="heart-outline"
        title="Saved outfits"
        subtitle={countLabel(stats.saved, 'outfit')}
        onPress={() => navigation.navigate('SavedTab')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  greeting: { ...type.display, color: colors.ink },
  tagline: {
    ...type.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  statValue: { ...type.title, fontSize: 24, color: colors.ink },
  statLabel: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconPrimary: { backgroundColor: 'rgba(255,255,255,0.18)' },
  cardText: { flex: 1 },
  cardTitle: { ...type.heading, color: colors.ink },
  cardTitlePrimary: { color: colors.onAccent },
  cardSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
  cardSubtitlePrimary: { color: 'rgba(255,255,255,0.8)' },
});
