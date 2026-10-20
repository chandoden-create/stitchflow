import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
}

function pickWebImage(captureCamera: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (captureCamera) {
      input.setAttribute('capture', 'environment');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl) {
          resolve(null);
          return;
        }
        // Compress via canvas so it fits comfortably in localStorage
        const img = new window.Image();
        img.onload = () => {
          try {
            const maxDim = 900;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressed = canvas.toDataURL('image/jpeg', 0.72);
              resolve(compressed);
              return;
            }
          } catch {
            // Fallback to raw dataUrl
          }
          resolve(dataUrl);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onImageSelected,
}) => {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const compressImage = async (uri: string): Promise<string> => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    return manipulated.uri;
  };

  const handleTakePhoto = async () => {
    setErrorMsg(null);
    if (Platform.OS === 'web') {
      setProcessing(true);
      const dataUrl = await pickWebImage(true);
      setProcessing(false);
      if (dataUrl) {
        onImageSelected(dataUrl);
        onClose();
      }
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Please allow camera access in device settings to capture garment photos.');
        return;
      }

      setProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedUri = await compressImage(result.assets[0].uri);
        onImageSelected(compressedUri);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to capture photo');
    } finally {
      setProcessing(false);
    }
  };

  const handleChooseFromGallery = async () => {
    setErrorMsg(null);
    if (Platform.OS === 'web') {
      setProcessing(true);
      const dataUrl = await pickWebImage(false);
      setProcessing(false);
      if (dataUrl) {
        onImageSelected(dataUrl);
        onClose();
      }
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Please allow photo library access to attach garment photos.');
        return;
      }

      setProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedUri = await compressImage(result.assets[0].uri);
        onImageSelected(compressedUri);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to select photo');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Attach Garment Photo</Text>
          <Text style={styles.subtitle}>
            Take a photo of the cloth material, measurement slip, or reference design
          </Text>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {processing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Processing garment photo...</Text>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: '#F3E8EC' }]}>
                  <Ionicons name="camera" size={24} color={Colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Take Photo with Camera</Text>
                  <Text style={styles.optionDescription}>
                    Capture garment fabric or reference design now
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.placeholder} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleChooseFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: '#FDF8ED' }]}>
                  <Ionicons name="images" size={24} color={Colors.gold} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDescription}>
                    Select an existing photo from your phone
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.placeholder} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxs,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    padding: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.error,
    flex: 1,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  optionDescription: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
  },
  cancelText: {
    ...Typography.headline,
    color: Colors.textSecondary,
  },
});
