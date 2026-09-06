import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, layout, spacing, type } from '../constants/theme';

export default function SignUpScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>OUTFITGENERATOR</Text>
        <Text style={styles.headline}>Build your closet.</Text>
        <Text style={styles.tagline}>Create an account to get started.</Text>

        <View style={styles.form}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Optional" />
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
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="At least 6 characters"
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Create account" onPress={handleSubmit} loading={loading} style={styles.submit} />
        </View>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.switchLink} hitSlop={8}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextAccent}>Log in</Text>
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
