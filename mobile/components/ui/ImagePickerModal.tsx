import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onImageSelected,
}) => {
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to photograph garments directly.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to capture photo');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please grant photo library access to select garment photos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select photo');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.dragHandle} />
              <Text style={styles.title}>Add Garment Photograph</Text>
              <Text style={styles.subtitle}>
                Photograph fabric, lining, pattern, or fitting details
              </Text>

              <TouchableOpacity
                style={styles.option}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8EC' }]}>
                  <Ionicons name="camera" size={24} color={Colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Take Photo</Text>
                  <Text style={styles.optionDescription}>Use phone camera directly</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.placeholder} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#FDF8ED' }]}>
                  <Ionicons name="images" size={24} color={Colors.gold} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDescription}>Select from saved pictures</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.placeholder} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl + 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
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
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 14,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
