import { PrismaClient, ConsentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create demo designer with user account
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const designer = await prisma.designer.upsert({
    where: { email: 'admin@stitchflow.app' },
    update: {},
    create: {
      name: 'Bhagyashri',
      businessName: 'Bhagyashri Tailoring',
      email: 'admin@stitchflow.app',
      phone: '+919876543210',
      address: '12, Shivaji Nagar, Pune, Maharashtra 411005',
      currency: 'INR',
      currencySymbol: '₹',
      whatsappSandboxMode: true,
      messageSignature: 'Bhagyashri Tailoring — ✂️ Crafted with love',
      userAccount: {
        create: {
          email: 'admin@stitchflow.app',
          passwordHash,
          isVerified: true,
        },
      },
    },
  });

  console.log(`✅ Designer created: ${designer.name} (${designer.email})`);

  // Demo customers with realistic Indian names and WhatsApp numbers
  const customersData = [
    {
      name: 'Priya Sharma',
      whatsappNumber: '+919823456701',
      altPhone: '+919823456702',
      notes: 'Prefers cotton fabric. Regular customer.',
      consentStatus: ConsentStatus.GIVEN,
      consentRecordedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      name: 'Kavitha Reddy',
      whatsappNumber: '+919765432109',
      altPhone: null,
      notes: 'Allergic to synthetic fabric. Always double-check material.',
      consentStatus: ConsentStatus.GIVEN,
      consentRecordedAt: new Date('2024-02-20T14:00:00Z'),
    },
    {
      name: 'Sunita Patil',
      whatsappNumber: '+919988776655',
      altPhone: '+919988776656',
      notes: 'Bridal order customer. Requires special attention.',
      consentStatus: ConsentStatus.PENDING,
      consentRecordedAt: null,
    },
  ];

  const customers = [];
  for (const customerData of customersData) {
    const customer = await prisma.customer.upsert({
      where: {
        designerId_whatsappNumber: {
          designerId: designer.id,
          whatsappNumber: customerData.whatsappNumber,
        },
      },
      update: {},
      create: {
        designerId: designer.id,
        ...customerData,
      },
    });
    customers.push(customer);
    console.log(`✅ Customer created: ${customer.name}`);
  }

  // Create a sample order for Priya Sharma
  const existingOrder = await prisma.order.findFirst({
    where: { designerId: designer.id, customerId: customers[0].id },
  });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        designerId: designer.id,
        customerId: customers[0].id,
        orderNumber: 'SF-0001',
        status: 'IN_PROGRESS',
        subtotal: '1200.00',
        discount: '100.00',
        additionalCharges: '50.00',
        finalTotal: '1150.00',
        advanceAmount: '500.00',
        balanceDue: '650.00',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Wedding blouse - needs extra embroidery work',
        items: {
          create: [
            {
              garmentType: 'BLOUSE_STITCHING',
              description: 'Silk blouse with designer back neck',
              quantity: 1,
              unitPrice: '800.00',
              lineTotal: '800.00',
              sortOrder: 1,
            },
            {
              garmentType: 'BLOUSE_FITTING',
              description: 'Existing blouse fitting and alteration',
              quantity: 2,
              unitPrice: '200.00',
              lineTotal: '400.00',
              sortOrder: 2,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: '500.00',
              paymentMethod: PaymentMethod.UPI,
              transactionRef: 'UPI-REF-12345',
              notes: 'Advance payment',
              receivedAt: new Date(),
            },
          ],
        },
        statusHistory: {
          create: [
            {
              previousStatus: null,
              newStatus: 'RECEIVED',
              changedBy: designer.id,
              notes: 'Order created',
            },
            {
              previousStatus: 'RECEIVED',
              newStatus: 'IN_PROGRESS',
              changedBy: designer.id,
              notes: 'Work started',
            },
          ],
        },
      },
    });

    console.log(`✅ Sample order created: ${order.orderNumber}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login credentials:');
  console.log('  Email:    admin@stitchflow.app');
  console.log('  Password: Demo@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
