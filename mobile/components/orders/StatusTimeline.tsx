import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { formatDate } from '../../lib/utils/date';

interface StatusTimelineProps {
  currentStatus: string;
  createdAt: string;
  completedAt?: string | null;
  deliveredAt?: string | null;
}

const STAGES = [
  { key: 'RECEIVED', label: 'Received', icon: 'inbox' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: 'construct' },
  { key: 'COMPLETED', label: 'Ready for Pickup', icon: 'checkmark-circle' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'bag-check' },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  createdAt,
  completedAt,
  deliveredAt,
}) => {
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 0;
      case 'IN_PROGRESS':
        return 1;
      case 'COMPLETED':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>

      <View style={styles.timeline}>
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          let timestamp = '';
          if (stage.key === 'RECEIVED') timestamp = formatDate(createdAt);
          if (stage.key === 'COMPLETED' && completedAt) timestamp = formatDate(completedAt);
          if (stage.key === 'DELIVERED' && deliveredAt) timestamp = formatDate(deliveredAt);

          return (
            <View key={stage.key} style={styles.stageItem}>
              {/* Connector line */}
              {idx > 0 ? (
                <View
                  style={[
                    styles.connector,
                    isPassed || isCurrent ? styles.activeConnector : styles.pendingConnector,
                  ]}
                />
              ) : null}

              {/* Node indicator */}
              <View
                style={[
                  styles.node,
                  isPassed && styles.passedNode,
                  isCurrent && styles.currentNode,
                  isPending && styles.pendingNode,
                ]}
              >
                {isPassed ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Ionicons
                    name={stage.icon as any}
                    size={14}
                    color={isCurrent ? Colors.white : Colors.placeholder}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.stageLabel,
                  isCurrent && styles.currentStageLabel,
                  isPending && styles.pendingStageLabel,
                ]}
                numberOfLines={2}
              >
                {stage.label}
              </Text>

              {timestamp ? (
                <Text style={styles.stageTime}>{timestamp}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
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
  title: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  stageItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 14,
    left: '-50%',
    right: '50%',
    height: 3,
    zIndex: 0,
  },
  activeConnector: {
    backgroundColor: Colors.primary,
  },
  pendingConnector: {
    backgroundColor: Colors.divider,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: 6,
  },
  passedNode: {
    backgroundColor: Colors.primary,
  },
  currentNode: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingNode: {
    backgroundColor: Colors.divider,
  },
  stageLabel: {
    ...Typography.caption2,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  currentStageLabel: {
    color: Colors.gold,
    fontWeight: '700',
  },
  pendingStageLabel: {
    color: Colors.textSecondary,
  },
  stageTime: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
