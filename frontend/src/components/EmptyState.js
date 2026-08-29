import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, radii, spacing, type } from '../constants/theme';

export default function EmptyState({ icon = 'shirt-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={colors.inkFaint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...type.heading, color: colors.ink, marginBottom: spacing.xs, textAlign: 'center' },
  message: {
    ...type.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  action: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 240 },
});
