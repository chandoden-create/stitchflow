import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CurrencyText } from '../ui/CurrencyText';
import { ImagePickerModal } from '../ui/ImagePickerModal';
import { GARMENT_TYPES } from '../../lib/constants/garmentTypes';

export interface OrderItemFormData {
  garmentType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  notes?: string;
  photoUri?: string;
}

interface OrderItemFormProps {
  onSave: (item: OrderItemFormData) => void;
  onCancel: () => void;
}

export const OrderItemForm: React.FC<OrderItemFormProps> = ({ onSave, onCancel }) => {
  const [garmentType, setGarmentType] = useState('BLOUSE_STITCHING');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('800');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseFloat(unitPrice) || 0;
  const lineTotal = quantity * priceNum;

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleSave = () => {
    if (!description.trim()) {
      setError('Please enter item description (e.g. Silk blouse with back neck design)');
      return;
    }
    if (priceNum <= 0) {
      setError('Please enter a valid price per unit');
      return;
    }

    setError(null);
    onSave({
      garmentType,
      description: description.trim(),
      quantity,
      unitPrice: priceNum.toFixed(2),
      notes: notes.trim() || undefined,
      photoUri,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Garment Item</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Garment Type Picker */}
      <Text style={styles.sectionLabel}>Garment Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.garmentTypesList}
      >
        {GARMENT_TYPES.map((type) => {
          const isSelected = garmentType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeChip, isSelected && styles.selectedTypeChip]}
              onPress={() => {
                setGarmentType(type.value);
                if (!description) {
                  setDescription(type.label);
                }
              }}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={isSelected ? Colors.white : Colors.primary}
              />
              <Text style={[styles.typeText, isSelected && styles.selectedTypeText]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Item Description */}
      <Input
        label="Description / Design Details *"
        placeholder="e.g. Designer blouse with lace & latkan"
        value={description}
        onChangeText={setDescription}
      />

      {/* Quantity & Unit Price Row */}
      <View style={styles.row}>
        {/* Quantity Stepper */}
        <View style={styles.quantityContainer}>
          <Text style={styles.fieldLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={handleDecrement}
              disabled={quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={18}
                color={quantity <= 1 ? Colors.placeholder : Colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={handleIncrement}>
              <Ionicons name="add" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit Price */}
        <View style={styles.priceContainer}>
          <Input
            label="Price per unit (₹) *"
            placeholder="800"
            keyboardType="numeric"
            value={unitPrice}
            onChangeText={setUnitPrice}
          />
        </View>
      </View>

      {/* Line Total Banner */}
      <View style={styles.lineTotalBanner}>
        <Text style={styles.lineTotalLabel}>Item Total:</Text>
        <CurrencyText amount={lineTotal} style={styles.lineTotalValue} />
      </View>

      {/* Photo Capture Section */}
      <Text style={styles.sectionLabel}>Garment Photograph</Text>
      {photoUri ? (
        <View style={styles.photoPreviewCard}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setIsPhotoModalOpen(true)}
            >
              <Ionicons name="camera-reverse" size={16} color={Colors.primary} />
              <Text style={styles.retakeText}>Replace Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setPhotoUri(undefined)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoCard}
          onPress={() => setIsPhotoModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cameraCircle}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.addPhotoTitle}>Take or Choose Garment Photo</Text>
          <Text style={styles.addPhotoDesc}>
            Helps immediately identify fabric, neck design & measurements
          </Text>
        </TouchableOpacity>
      )}

      {/* Optional Notes */}
      <Input
        label="Item Notes (Optional)"
        placeholder="e.g. Lining fabric provided by customer, extra border attached"
        value={notes}
        onChangeText={setNotes}
      />

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelBtn}
        />
        <Button
          label="Add to Order"
          variant="primary"
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </View>

      <ImagePickerModal
        visible={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onImageSelected={(uri) => setPhotoUri(uri)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    padding: Spacing.sm,
    borderRadius: 10,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.error,
    flex: 1,
  },
  sectionLabel: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  garmentTypesList: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTypeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  quantityContainer: {
    flex: 1,
  },
  priceContainer: {
    flex: 1.2,
  },
  fieldLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  lineTotalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 12,
    marginVertical: Spacing.xs,
  },
  lineTotalLabel: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  lineTotalValue: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.primary,
  },
  addPhotoCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: '#FCFAF7',
    marginBottom: Spacing.sm,
  },
  cameraCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  addPhotoTitle: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  addPhotoDesc: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  photoPreviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.xs,
  },
  retakeText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.xs,
  },
  removeText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.5,
  },
});
