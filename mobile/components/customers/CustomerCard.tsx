import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { CurrencyText } from '../ui/CurrencyText';
import { Avatar } from '../ui/Avatar';

interface CustomerCardProps {
  id: string;
  name: string;
  whatsappNumber: string;
  altPhone?: string | null;
  activeOrdersCount?: number;
  outstandingBalance?: string | number;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  id,
  name,
  whatsappNumber,
  activeOrdersCount = 0,
  outstandingBalance = 0,
  onPress,
}) => {
  const hasOutstanding = Number(outstandingBalance) > 0;

  const handleWhatsAppPress = async () => {
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'WhatsApp Not Found',
        'WhatsApp does not appear to be installed on this device.',
      );
    }
  };

  const handleCallPress = async () => {
    const url = `tel:${whatsappNumber}`;
    await Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <Avatar name={name} size={44} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{whatsappNumber}</Text>
        </View>

        {/* Quick actions for call and whatsapp */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCallPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="call" size={16} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.waBtn]}
            onPress={handleWhatsAppPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.statPill}>
          <Ionicons name="briefcase-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.statText}>
            {activeOrdersCount} {activeOrdersCount === 1 ? 'order' : 'orders'}
          </Text>
        </View>

        {hasOutstanding ? (
          <View style={[styles.statPill, styles.duePill]}>
            <Text style={styles.dueLabel}>Due: </Text>
            <CurrencyText amount={outstandingBalance} style={styles.dueAmount} />
          </View>
        ) : (
          <View style={[styles.statPill, styles.clearPill]}>
            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
            <Text style={styles.clearText}>All settled</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)', // Luxury gold edge
    shadowColor: '#6B2D3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.headline,
    color: Colors.text,
  },
  phone: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#F3E8EC',
  },
  waBtn: {
    backgroundColor: '#E8F8EE',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  duePill: {
    backgroundColor: '#FFF2F2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dueLabel: {
    ...Typography.caption1,
    color: Colors.error,
    fontWeight: '600',
  },
  dueAmount: {
    ...Typography.caption1,
    color: Colors.error,
    fontWeight: '700',
  },
  clearPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  clearText: {
    ...Typography.caption1,
    color: Colors.success,
    fontWeight: '600',
  },
});
