import { Colors } from '@/theme/colors';

export type OrderStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  nextStatus?: OrderStatus;
  nextLabel?: string;
}> = {
  RECEIVED: {
    label: 'Received',
    color: '#007AFF',
    bgColor: '#E8F1FF',
    icon: 'inbox',
    nextStatus: 'IN_PROGRESS',
    nextLabel: 'Mark In Progress',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#FF9F0A',
    bgColor: '#FFF3E0',
    icon: 'construct',
    nextStatus: 'COMPLETED',
    nextLabel: 'Mark Completed',
  },
  COMPLETED: {
    label: 'Ready for Pickup',
    color: Colors.gold,
    bgColor: '#FDF8ED',
    icon: 'checkmark-circle',
    nextStatus: 'DELIVERED',
    nextLabel: 'Mark as Delivered',
  },
  DELIVERED: {
    label: 'Delivered',
    color: Colors.success,
    bgColor: '#E8F5E9',
    icon: 'bag-check',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#8E8E93',
    bgColor: '#F2F2F7',
    icon: 'close-circle',
  },
};

export function getStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? ORDER_STATUS_CONFIG.RECEIVED;
}

export const getOrderStatusConfig = getStatusConfig;


export const ALL_STATUSES: OrderStatus[] = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'];

export const ACTIVE_STATUSES: OrderStatus[] = ['RECEIVED', 'IN_PROGRESS'];

export function calculateOrderTotals(items: Array<{ quantity: number; unitPrice: number }>, discount = 0, additionalCharges = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal - discount + additionalCharges;
  return { subtotal, total };
}

export function getBalanceDue(total: number, advancePaid: number): number {
  return Math.max(0, total - advancePaid);
}
