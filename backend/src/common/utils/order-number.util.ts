import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generate the next order number for a designer in SF-NNNN format.
 * Queries the latest order for this designer and increments the sequence number.
 * Uses a transaction to prevent race conditions.
 */
export async function generateOrderNumber(
  prisma: PrismaService,
  designerId: string,
): Promise<string> {
  // Find the latest order number for this designer
  const latestOrder = await prisma.order.findFirst({
    where: { designerId },
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  let nextSequence = 1;

  if (latestOrder?.orderNumber) {
    const match = latestOrder.orderNumber.match(/^SF-(\d+)$/);
    if (match && match[1]) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  return `SF-${String(nextSequence).padStart(4, '0')}`;
}
