import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { resetPassword } from '../api/auth';
import { colors, layout, spacing, type } from '../constants/theme';

const MIN_PASSWORD_LENGTH = 6;

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headline}>Password reset.</Text>
          <Text style={styles.tagline}>Log in with your new password.</Text>
          <Button label="Back to log in" onPress={() => navigation.navigate('Login')} style={styles.submit} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>OUTFITGENERATOR</Text>
        <Text style={styles.headline}>Reset your password.</Text>
        <Text style={styles.tagline}>Enter your email and a new password.</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="••••••••"
          />
          <TextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="••••••••"
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Reset password" onPress={handleSubmit} loading={loading} style={styles.submit} />
        </View>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.switchLink} hitSlop={8}>
          <Text style={styles.switchText}>
            Remembered it? <Text style={styles.switchTextAccent}>Back to log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  eyebrow: { ...type.overline, color: colors.accent, marginBottom: spacing.md, textAlign: 'center' },
  headline: { ...type.display, fontSize: 30, color: colors.ink, textAlign: 'center' },
  tagline: {
    ...type.subtitleItalic,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: { marginTop: spacing.sm },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: 4, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { ...type.caption, color: colors.danger },
  submit: { marginTop: spacing.xs },
  switchLink: { marginTop: spacing.xl, alignSelf: 'center' },
  switchText: { ...type.caption, color: colors.inkMuted },
  switchTextAccent: { color: colors.accentDeep, fontWeight: '600' },
});
