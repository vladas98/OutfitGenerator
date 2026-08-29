import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { uploadItemsBatch } from '../api/items';
import { colors, radii, spacing, type } from '../constants/theme';

export default function UploadScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to add items.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) setAssets((prev) => [...prev, ...result.assets]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to add items.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setAssets((prev) => [...prev, ...result.assets]);
  };

  const handleUpload = async () => {
    if (assets.length === 0) return;
    setUploading(true);
    try {
      const items = await uploadItemsBatch(assets);
      setAssets([]);
      navigation.navigate('Review', { itemIds: items.map((i) => i._id) });
    } catch (err) {
      Alert.alert(
        'Upload failed',
        'Could not upload your photos. Check that the backend is running and reachable, then try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <Button
          label="Take photo"
          icon="camera-outline"
          variant="secondary"
          onPress={takePhoto}
          style={styles.actionButton}
        />
        <Button
          label="Choose photos"
          icon="images-outline"
          variant="secondary"
          onPress={pickFromLibrary}
          style={styles.actionButton}
        />
      </View>

      {assets.length === 0 ? (
        <EmptyState
          icon="camera-outline"
          title="Add your clothes"
          message="Photograph items one at a time against a plain background. You can select several at once — they'll all be tagged automatically."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.thumbGrid}>
          {assets.map((asset) => (
            <Pressable
              key={asset.uri}
              style={styles.thumbWrapper}
              onPress={() => setAssets((prev) => prev.filter((a) => a.uri !== asset.uri))}
            >
              <Image source={{ uri: asset.uri }} style={styles.thumb} />
              <View style={styles.removeBadge}>
                <Ionicons name="close" size={13} color={colors.onAccent} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Button
        label={
          assets.length === 0
            ? 'Add photos to continue'
            : `Upload ${assets.length} item${assets.length === 1 ? '' : 's'}`
        }
        icon={assets.length > 0 ? 'cloud-upload-outline' : undefined}
        onPress={handleUpload}
        loading={uploading}
        disabled={assets.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  actionButton: { flex: 1 },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  thumbWrapper: { width: '30%', aspectRatio: 1 },
  thumb: { width: '100%', height: '100%', borderRadius: radii.md, backgroundColor: colors.surface },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
