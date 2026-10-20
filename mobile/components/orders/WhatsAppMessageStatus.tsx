import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { formatDate } from '../../lib/utils/date';

interface WhatsAppMessage {
  id: string;
  messageType: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  errorMessage?: string | null;
}

interface WhatsAppMessageStatusProps {
  messages: WhatsAppMessage[];
  onRetry?: (id: string) => void;
}

export const WhatsAppMessageStatus: React.FC<WhatsAppMessageStatusProps> = ({
  messages,
  onRetry,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { name: 'checkmark-done', color: '#25D366' };
      case 'SENT':
        return { name: 'checkmark', color: Colors.info };
      case 'MOCK_SENT':
        return { name: 'shield-checkmark', color: Colors.gold };
      case 'FAILED':
        return { name: 'alert-circle', color: Colors.error };
      default:
        return { name: 'time-outline', color: Colors.textSecondary };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'Delivered to WhatsApp';
      case 'SENT':
        return 'Sent to WhatsApp';
      case 'MOCK_SENT':
        return 'Logged (Sandbox Mode)';
      case 'FAILED':
        return 'Delivery Failed';
      default:
        return 'Queued';
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'ORDER_RECEIVED':
        return 'Order Confirmation';
      case 'ORDER_COMPLETED':
        return 'Ready for Pickup';
      case 'ORDER_DELIVERED':
        return 'Delivery Summary';
      default:
        return type;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
        <Text style={styles.title}>WhatsApp Updates</Text>
      </View>

      {messages.length === 0 ? (
        <Text style={styles.emptyText}>No notifications sent yet</Text>
      ) : (
        messages.map((msg) => {
          const icon = getStatusIcon(msg.status);
          const isFailed = msg.status === 'FAILED';

          return (
            <View key={msg.id} style={styles.messageRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9F3' }]}>
                <Ionicons name={icon.name as any} size={16} color={icon.color} />
              </View>

              <View style={styles.info}>
                <Text style={styles.typeText}>{formatType(msg.messageType)}</Text>
                <Text style={[styles.statusText, { color: icon.color }]}>
                  {getStatusText(msg.status)}
                </Text>
                {msg.errorMessage ? (
                  <Text style={styles.errorText}>{msg.errorMessage}</Text>
                ) : null}
              </View>

              <View style={styles.rightSide}>
                <Text style={styles.timeText}>{formatDate(msg.createdAt)}</Text>
                {isFailed && onRetry ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => onRetry(msg.id)}
                  >
                    <Ionicons name="refresh" size={12} color={Colors.white} />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  emptyText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  typeText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  statusText: {
    ...Typography.caption2,
    fontWeight: '600',
    marginTop: 2,
  },
  errorText: {
    ...Typography.caption2,
    color: Colors.error,
    marginTop: 2,
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  retryText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
  },
});
