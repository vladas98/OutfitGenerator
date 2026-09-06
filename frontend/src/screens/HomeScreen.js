import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listItems } from '../api/items';
import { listSavedOutfits } from '../api/outfits';
import { useAuth } from '../context/AuthContext';
import { colors, layout, radii, spacing, type } from '../constants/theme';

function MenuRow({ icon, title, subtitle, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
    >
      <Ionicons name={icon} size={19} color={colors.ink} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ items: null, saved: null });

  useFocusEffect(
    useCallback(() => {
      Promise.all([listItems(), listSavedOutfits()])
        .then(([items, saved]) => setStats({ items: items.length, saved: saved.length }))
        .catch(() => setStats({ items: null, saved: null }));
    }, [])
  );

  const countLabel = (n, singular) =>
    n === null ? 'View your closet' : `${n} ${n === 1 ? singular : `${singular}s`}`;

  const handleLogout = () => {
    Alert.alert('Log out', 'You can always log back in to the same closet.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>OUTFITGENERATOR</Text>
      <Text style={styles.headline}>
        {user?.name ? `Hi, ${user.name.split(' ')[0]}.` : 'Style, from\nyour own closet.'}
      </Text>
      <Text style={styles.tagline}>AI-styled outfits, built from what you already own.</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.items ?? '—'}</Text>
          <Text style={styles.statLabel}>ITEMS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.saved ?? '—'}</Text>
          <Text style={styles.statLabel}>SAVED LOOKS</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('OutfitsTab')}
        style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
      >
        <View>
          <Text style={styles.heroEyebrow}>TODAY'S PICK</Text>
          <Text style={styles.heroTitle}>Generate an outfit</Text>
          <Text style={styles.heroSubtitle}>Pick an occasion, get a styled look</Text>
        </View>
        <View style={styles.heroIconCircle}>
          <Ionicons name="sparkles" size={20} color={colors.onAccent} />
        </View>
      </Pressable>

      <Text style={styles.sectionLabel}>YOUR WARDROBE</Text>
      <View style={styles.menu}>
        <MenuRow
          icon="camera-outline"
          title="Add items"
          subtitle="Photograph clothes to build your closet"
          onPress={() => navigation.navigate('AddTab')}
        />
        <MenuRow
          icon="grid-outline"
          title="My closet"
          subtitle={countLabel(stats.items, 'item')}
          onPress={() => navigation.navigate('ClosetTab')}
        />
        <MenuRow
          icon="heart-outline"
          title="Saved outfits"
          subtitle={countLabel(stats.saved, 'outfit')}
          onPress={() => navigation.navigate('SavedTab')}
          last
        />
      </View>

      <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>ACCOUNT</Text>
      <View style={styles.menu}>
        <MenuRow icon="log-out-outline" title="Log out" subtitle={user?.email} onPress={handleLogout} last />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  eyebrow: { ...type.overline, color: colors.accent, marginBottom: spacing.md },
  headline: { ...type.display, color: colors.ink },
  tagline: {
    ...type.subtitleItalic,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { ...type.title, fontSize: 26, color: colors.ink },
  statLabel: { ...type.overline, color: colors.inkFaint, marginTop: 4 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  heroPressed: { opacity: 0.92 },
  heroEyebrow: {
    ...type.overline,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  heroTitle: { ...type.title, fontSize: 19, color: colors.onAccent },
  heroSubtitle: { ...type.caption, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { ...type.overline, color: colors.inkFaint, marginBottom: spacing.sm },
  sectionLabelSpaced: { marginTop: spacing.xxl },
  menu: {
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  rowLast: {},
  rowPressed: { backgroundColor: colors.surface },
  rowIcon: { width: 22 },
  rowText: { flex: 1 },
  rowTitle: { ...type.heading, color: colors.ink },
  rowSubtitle: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
});
