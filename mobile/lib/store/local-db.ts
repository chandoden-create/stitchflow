import { storage } from '@/lib/utils/storage';
import type { DesignerProfile } from '@/lib/api/auth.api';
import type { Customer, CreateCustomerData, CustomersListResponse } from '@/lib/api/customers.api';
import type { Order, CreateOrderData, OrdersListResponse, DashboardStats, Payment, WhatsAppNotification } from '@/lib/api/orders.api';

const DB_STORAGE_KEY = 'stitchflow_local_db_v2';

export interface LocalDatabaseSchema {
  designer: DesignerProfile;
  customers: Customer[];
  orders: Order[];
  nextOrderSeq: number;
}

export const DEFAULT_DESIGNER: DesignerProfile = {
  id: 'designer-bhagyashri-01',
  name: 'Bhagyashri',
  designerName: 'Bhagyashri',
  businessName: 'Bhagyashri Tailoring',
  email: 'admin@stitchflow.app',
  phone: '+919876543210',
  address: 'Shop 4, Royal Arcade, MG Road, Pune',
  currency: 'INR',
  currencySymbol: '₹',
  whatsappPhoneNumberId: '',
  whatsappAccessToken: '',
  whatsappSandboxMode: true,
  messageSignature: 'Thank you for choosing Bhagyashri Tailoring! 🪡✨',
  createdAt: new Date().toISOString(),
};

function createSeedDatabase(): LocalDatabaseSchema {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysForward = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysForward = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const customers: Customer[] = [
    {
      id: 'cust-seed-1',
      name: 'Priya Sharma',
      whatsappNumber: '+919820112233',
      altPhone: '+919820112234',
      notes: 'Prefers princess-cut blouse with deep back dori and latkan. Chest: 36", Waist: 30", Blouse Length: 14.5".',
      consentStatus: 'GIVEN',
      whatsappConsent: true,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'cust-seed-2',
      name: 'Ananya Deshmukh',
      whatsappNumber: '+919823445566',
      notes: 'Bridal trousseau client. Prefers lining with pure cotton astar and concealed side zip.',
      consentStatus: 'GIVEN',
      whatsappConsent: true,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'cust-seed-3',
      name: 'Meera Kulkarni',
      whatsappNumber: '+919765112299',
      notes: 'Regular kurti & salwar suit customer. Sleeve length: 16" (3/4th sleeves).',
      consentStatus: 'GIVEN',
      whatsappConsent: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const orders: Order[] = [
    {
      id: 'order-seed-1001',
      orderNumber: 'SF-1001',
      customerId: 'cust-seed-1',
      status: 'COMPLETED',
      subtotal: '2400.00',
      discount: '100.00',
      additionalCharges: '200.00',
      finalTotal: '2500.00',
      advanceAmount: '1000.00',
      balanceDue: '1500.00',
      dueDate: threeDaysForward.toISOString().split('T')[0],
      completedAt: now.toISOString(),
      notes: 'Deliver before Friday evening function. Golden bead latkan attached.',
      items: [
        {
          id: 'item-seed-1',
          garmentType: 'BLOUSE_STITCHING',
          description: 'Designer Bridal Silk Blouse with Zari Border & Padded Cups',
          quantity: 1,
          unitPrice: '1600.00',
          lineTotal: '1600.00',
          notes: 'Padded princess cut, back hook with golden dori',
          photos: [],
          sortOrder: 0,
        },
        {
          id: 'item-seed-2',
          garmentType: 'BLOUSE_STITCHING',
          description: 'Brocade Saree Blouse with Elbow Length Sleeves',
          quantity: 1,
          unitPrice: '800.00',
          lineTotal: '800.00',
          notes: 'Piping on neck and sleeves',
          photos: [],
          sortOrder: 1,
        },
      ],
      payments: [
        {
          id: 'pay-seed-1',
          amount: '1000.00',
          paymentMethod: 'UPI',
          transactionRef: 'UPI-41298831',
          notes: 'Advance payment at booking',
          receivedAt: twoDaysAgo.toISOString(),
        },
      ],
      statusHistory: [
        {
          id: 'hist-seed-1',
          previousStatus: null,
          newStatus: 'RECEIVED',
          changedBy: 'Bhagyashri',
          notes: 'Order registered',
          changedAt: twoDaysAgo.toISOString(),
        },
        {
          id: 'hist-seed-2',
          previousStatus: 'RECEIVED',
          newStatus: 'IN_PROGRESS',
          changedBy: 'Bhagyashri',
          notes: 'Cutting and stitching started',
          changedAt: yesterday.toISOString(),
        },
        {
          id: 'hist-seed-3',
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED',
          changedBy: 'Bhagyashri',
          notes: 'Finishing and steam ironing done. Ready for pickup.',
          changedAt: now.toISOString(),
        },
      ],
      whatsappMessages: [
        {
          id: 'wa-seed-1',
          messageType: 'ORDER_RECEIVED',
          status: 'MOCK_SENT',
          createdAt: twoDaysAgo.toISOString(),
          sentAt: twoDaysAgo.toISOString(),
        },
        {
          id: 'wa-seed-2',
          messageType: 'ORDER_COMPLETED',
          status: 'MOCK_SENT',
          createdAt: now.toISOString(),
          sentAt: now.toISOString(),
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'order-seed-1002',
      orderNumber: 'SF-1002',
      customerId: 'cust-seed-2',
      status: 'IN_PROGRESS',
      subtotal: '3200.00',
      discount: '0.00',
      additionalCharges: '0.00',
      finalTotal: '3200.00',
      advanceAmount: '1500.00',
      balanceDue: '1700.00',
      dueDate: fiveDaysForward.toISOString().split('T')[0],
      notes: 'Urgent bridal lehenga choli & dupatta finishing.',
      items: [
        {
          id: 'item-seed-3',
          garmentType: 'DRESS_STITCHING',
          description: 'Custom Anarkali Gown with Can-Can & Latkan',
          quantity: 1,
          unitPrice: '3200.00',
          lineTotal: '3200.00',
          notes: 'Full flair length 56 inches',
          photos: [],
          sortOrder: 0,
        },
      ],
      payments: [
        {
          id: 'pay-seed-2',
          amount: '1500.00',
          paymentMethod: 'CASH',
          notes: 'Cash advance',
          receivedAt: yesterday.toISOString(),
        },
      ],
      statusHistory: [
        {
          id: 'hist-seed-4',
          previousStatus: null,
          newStatus: 'RECEIVED',
          changedBy: 'Bhagyashri',
          notes: 'Order registered',
          changedAt: yesterday.toISOString(),
        },
        {
          id: 'hist-seed-5',
          previousStatus: 'RECEIVED',
          newStatus: 'IN_PROGRESS',
          changedBy: 'Bhagyashri',
          notes: 'Masterji working on embroidery neck',
          changedAt: now.toISOString(),
        },
      ],
      whatsappMessages: [
        {
          id: 'wa-seed-3',
          messageType: 'ORDER_RECEIVED',
          status: 'MOCK_SENT',
          createdAt: yesterday.toISOString(),
          sentAt: yesterday.toISOString(),
        },
      ],
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'order-seed-1003',
      orderNumber: 'SF-1003',
      customerId: 'cust-seed-3',
      status: 'RECEIVED',
      subtotal: '950.00',
      discount: '0.00',
      additionalCharges: '0.00',
      finalTotal: '950.00',
      advanceAmount: '450.00',
      balanceDue: '500.00',
      dueDate: threeDaysForward.toISOString().split('T')[0],
      notes: 'Cotton daily wear kurti + pant set.',
      items: [
        {
          id: 'item-seed-4',
          garmentType: 'KURTI_STITCHING',
          description: 'Straight Cut Kurti with Pant Pocket & Lace Trim',
          quantity: 1,
          unitPrice: '950.00',
          lineTotal: '950.00',
          notes: 'Mandarin collar neck',
          photos: [],
          sortOrder: 0,
        },
      ],
      payments: [
        {
          id: 'pay-seed-3',
          amount: '450.00',
          paymentMethod: 'UPI',
          notes: 'Advance via GPay',
          receivedAt: now.toISOString(),
        },
      ],
      statusHistory: [
        {
          id: 'hist-seed-6',
          previousStatus: null,
          newStatus: 'RECEIVED',
          changedBy: 'Bhagyashri',
          notes: 'Order registered',
          changedAt: now.toISOString(),
        },
      ],
      whatsappMessages: [
        {
          id: 'wa-seed-4',
          messageType: 'ORDER_RECEIVED',
          status: 'MOCK_SENT',
          createdAt: now.toISOString(),
          sentAt: now.toISOString(),
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  return {
    designer: DEFAULT_DESIGNER,
    customers,
    orders,
    nextOrderSeq: 1004,
  };
}

let memoryCache: LocalDatabaseSchema | null = null;

export function normalizeIndianPhone(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '+91';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return `+91${digits.slice(-10)}`;
}

async function readDb(): Promise<LocalDatabaseSchema> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await storage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDatabaseSchema;
      if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.orders)) {
        // Ensure designer fields are complete
        parsed.designer = { ...DEFAULT_DESIGNER, ...(parsed.designer || {}) };
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to seed
  }
  const seeded = createSeedDatabase();
  memoryCache = seeded;
  await writeDb(seeded);
  return seeded;
}

async function writeDb(db: LocalDatabaseSchema): Promise<void> {
  memoryCache = db;
  await storage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  await storage.setItem('designer_profile', JSON.stringify(db.designer));
}

function hydrateCustomer(customer: Customer, allOrders: Order[]): Customer {
  const custOrders = allOrders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let totalBilled = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let activeOrders = 0;

  for (const ord of custOrders) {
    if (ord.status !== 'CANCELLED') {
      const finalAmt = parseFloat(String(ord.finalTotal)) || 0;
      const balAmt = parseFloat(String(ord.balanceDue)) || 0;
      const paidAmt = Math.max(0, finalAmt - balAmt);
      totalBilled += finalAmt;
      totalPaid += paidAmt;
      outstanding += balAmt;
      if (ord.status !== 'DELIVERED') {
        activeOrders += 1;
      }
    }
  }

  return {
    ...customer,
    totalOrders: custOrders.length,
    activeOrders,
    totalBilled: Number(totalBilled.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    outstandingBalance: Number(outstanding.toFixed(2)),
    orders: custOrders,
    stats: {
      totalOrders: custOrders.length,
      totalBilled: totalBilled.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstanding: outstanding.toFixed(2),
    },
    _count: {
      orders: custOrders.length,
    },
  };
}

function hydrateOrder(order: Order, allCustomers: Customer[]): Order {
  const customer = allCustomers.find((c) => c.id === order.customerId);
  return {
    ...order,
    customer: customer ? { ...customer } : order.customer,
    _count: {
      items: order.items?.length || 0,
      payments: order.payments?.length || 0,
    },
  };
}

export const localDb = {
  async getDesigner(): Promise<DesignerProfile> {
    const db = await readDb();
    return db.designer;
  },

  async updateDesigner(updates: Partial<DesignerProfile>): Promise<DesignerProfile> {
    const db = await readDb();
    const updatedName = updates.name ?? updates.designerName ?? db.designer.name ?? 'Bhagyashri';
    db.designer = {
      ...db.designer,
      ...updates,
      name: updatedName,
      designerName: updatedName,
    };
    await writeDb(db);
    return db.designer;
  },

  async listCustomers(params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> {
    const db = await readDb();
    const q = (params?.search || '').trim().toLowerCase();
    const qDigits = q.replace(/[^0-9]/g, '');

    let filtered = db.customers.map((c) => hydrateCustomer(c, db.orders));
    if (q) {
      filtered = filtered.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneClean = c.whatsappNumber.replace(/[^0-9]/g, '');
        const phoneMatch = qDigits.length > 0 && phoneClean.includes(qDigits);
        const rawPhoneMatch = c.whatsappNumber.toLowerCase().includes(q);
        return nameMatch || phoneMatch || rawPhoneMatch;
      });
    }

    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    const page = params?.page || 1;
    const limit = params?.limit || 100;

    return {
      data: filtered,
      customers: filtered,
      total: filtered.length,
      page,
      limit,
      totalPages: 1,
      hasMore: false,
    };
  },

  async getCustomerById(id: string): Promise<Customer> {
    const db = await readDb();
    const found = db.customers.find((c) => c.id === id);
    if (!found) {
      throw new Error('Customer not found');
    }
    return hydrateCustomer(found, db.orders);
  },

  async createCustomer(input: CreateCustomerData): Promise<Customer> {
    const db = await readDb();
    const cleanPhone = normalizeIndianPhone(input.whatsappNumber);
    const nowIso = new Date().toISOString();

    // Check if customer with same normalized phone already exists; if so, update & return it gracefully
    const existingIdx = db.customers.findIndex(
      (c) => normalizeIndianPhone(c.whatsappNumber) === cleanPhone
    );

    if (existingIdx !== -1) {
      const updatedExisting: Customer = {
        ...db.customers[existingIdx],
        name: input.name.trim() || db.customers[existingIdx].name,
        whatsappNumber: cleanPhone,
        altPhone: input.altPhone || input.alternatePhone || db.customers[existingIdx].altPhone,
        notes: input.notes !== undefined ? input.notes : db.customers[existingIdx].notes,
        consentStatus: (input.consentGiven ?? input.whatsappConsent ?? true) ? 'GIVEN' : 'PENDING',
        whatsappConsent: input.consentGiven ?? input.whatsappConsent ?? true,
        updatedAt: nowIso,
      };
      db.customers[existingIdx] = updatedExisting;
      await writeDb(db);
      return hydrateCustomer(updatedExisting, db.orders);
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: input.name.trim(),
      whatsappNumber: cleanPhone,
      altPhone: input.altPhone || input.alternatePhone || undefined,
      notes: input.notes || undefined,
      consentStatus: (input.consentGiven ?? input.whatsappConsent ?? true) ? 'GIVEN' : 'PENDING',
      whatsappConsent: input.consentGiven ?? input.whatsappConsent ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.customers.unshift(newCustomer);
    await writeDb(db);
    return hydrateCustomer(newCustomer, db.orders);
  },

  async updateCustomer(id: string, updates: Partial<CreateCustomerData>): Promise<Customer> {
    const db = await readDb();
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    const existing = db.customers[idx];
    const updated: Customer = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      whatsappNumber:
        updates.whatsappNumber !== undefined
          ? normalizeIndianPhone(updates.whatsappNumber)
          : existing.whatsappNumber,
      altPhone:
        updates.altPhone !== undefined || updates.alternatePhone !== undefined
          ? updates.altPhone || updates.alternatePhone
          : existing.altPhone,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    db.customers[idx] = updated;
    await writeDb(db);
    return hydrateCustomer(updated, db.orders);
  },

  async deleteCustomer(id: string): Promise<void> {
    const db = await readDb();
    db.customers = db.customers.filter((c) => c.id !== id);
    await writeDb(db);
  },

  async listOrders(params?: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersListResponse> {
    const db = await readDb();
    let list = db.orders.map((o) => hydrateOrder(o, db.customers));

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.customerId) {
      list = list.filter((o) => o.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((o) => {
        const orderMatch = o.orderNumber.toLowerCase().includes(q);
        const custNameMatch = o.customer?.name?.toLowerCase().includes(q) || false;
        const custPhoneMatch = o.customer?.whatsappNumber?.toLowerCase().includes(q) || false;
        return orderMatch || custNameMatch || custPhoneMatch;
      });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      data: list,
      orders: list,
      total: list.length,
      page: params?.page || 1,
      limit: params?.limit || 100,
      totalPages: 1,
      hasMore: false,
    };
  },

  async getOrderById(id: string): Promise<Order> {
    const db = await readDb();
    const found = db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!found) throw new Error('Order not found');
    return hydrateOrder(found, db.customers);
  },

  async createOrder(orderData: CreateOrderData & { items: any[] }): Promise<Order> {
    const db = await readDb();
    const nowIso = new Date().toISOString();

    const seq = db.nextOrderSeq || 1004;
    db.nextOrderSeq = seq + 1;
    const orderNumber = `SF-${seq}`;

    let subtotalNum = 0;
    const items = (orderData.items || []).map((item, idx) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, parseFloat(String(item.unitPrice)) || 0);
      const lineTotal = qty * unitPrice;
      subtotalNum += lineTotal;

      const photoUri = item.photoUri || item.localPhotoUri || item.photos?.[0]?.uri || item.photos?.[0]?.url;
      const photos = photoUri
        ? [
            {
              id: `photo-${Date.now()}-${idx}`,
              uri: photoUri,
              url: photoUri,
              presignedUrl: photoUri,
            },
          ]
        : item.photos || [];

      return {
        id: `item-${Date.now()}-${idx}`,
        garmentType: item.garmentType || 'BLOUSE_STITCHING',
        description: item.description || 'Custom Garment Stitching',
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        notes: item.notes || undefined,
        photoUri,
        localPhotoUri: photoUri,
        photos,
        sortOrder: item.sortOrder ?? idx,
      };
    });

    const discountNum = Math.max(0, parseFloat(String(orderData.discount || 0)) || 0);
    const addChargesNum = Math.max(0, parseFloat(String(orderData.additionalCharges || 0)) || 0);
    const finalTotalNum = Math.max(0, subtotalNum - discountNum + addChargesNum);
    const advanceNum = Math.max(0, parseFloat(String(orderData.advanceAmount || 0)) || 0);
    const balanceDueNum = Math.max(0, finalTotalNum - advanceNum);

    const payments: Payment[] = [];
    if (advanceNum > 0) {
      payments.push({
        id: `pay-${Date.now()}`,
        amount: advanceNum.toFixed(2),
        paymentMethod: 'CASH',
        notes: 'Advance payment received upon order registration',
        receivedAt: nowIso,
      });
    }

    const waStatus = db.designer.whatsappSandboxMode === false && db.designer.whatsappAccessToken ? 'SENT' : 'MOCK_SENT';

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: orderData.customerId,
      status: 'RECEIVED',
      subtotal: subtotalNum.toFixed(2),
      discount: discountNum.toFixed(2),
      additionalCharges: addChargesNum.toFixed(2),
      finalTotal: finalTotalNum.toFixed(2),
      advanceAmount: advanceNum.toFixed(2),
      balanceDue: balanceDueNum.toFixed(2),
      dueDate: orderData.dueDate || undefined,
      notes: orderData.notes || undefined,
      items,
      payments,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          previousStatus: null,
          newStatus: 'RECEIVED',
          changedBy: db.designer.name || 'Bhagyashri',
          notes: 'Order created and registered',
          changedAt: nowIso,
        },
      ],
      whatsappMessages: [
        {
          id: `wa-${Date.now()}`,
          messageType: 'ORDER_RECEIVED',
          status: waStatus,
          createdAt: nowIso,
          sentAt: nowIso,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.orders.unshift(newOrder);

    // Touch customer's updatedAt
    const custIdx = db.customers.findIndex((c) => c.id === orderData.customerId);
    if (custIdx !== -1) {
      db.customers[custIdx].updatedAt = nowIso;
    }

    await writeDb(db);
    return hydrateOrder(newOrder, db.customers);
  },

  async updateOrderStatus(id: string, dto: { status: string; notes?: string }): Promise<Order> {
    const db = await readDb();
    const idx = db.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx === -1) throw new Error('Order not found');

    const order = db.orders[idx];
    const nowIso = new Date().toISOString();
    const prevStatus = order.status;
    const newStatus = dto.status;

    order.status = newStatus;
    order.updatedAt = nowIso;
    if (newStatus === 'COMPLETED') {
      order.completedAt = nowIso;
    } else if (newStatus === 'DELIVERED') {
      order.deliveredAt = nowIso;
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      id: `hist-${Date.now()}`,
      previousStatus: prevStatus,
      newStatus,
      changedBy: db.designer.name || 'Bhagyashri',
      notes: dto.notes || `Status updated to ${newStatus}`,
      changedAt: nowIso,
    });

    if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
      if (!order.whatsappMessages) order.whatsappMessages = [];
      const waStatus = db.designer.whatsappSandboxMode === false && db.designer.whatsappAccessToken ? 'SENT' : 'MOCK_SENT';
      order.whatsappMessages.push({
        id: `wa-${Date.now()}`,
        messageType: newStatus === 'COMPLETED' ? 'ORDER_COMPLETED' : 'ORDER_DELIVERED',
        status: waStatus,
        createdAt: nowIso,
        sentAt: nowIso,
      });
    }

    db.orders[idx] = order;
    await writeDb(db);
    return hydrateOrder(order, db.customers);
  },

  async addPayment(
    id: string,
    dto: {
      amount: string | number;
      paymentMethod: string;
      transactionRef?: string;
      notes?: string;
      receivedAt?: string;
    }
  ): Promise<Order> {
    const db = await readDb();
    const idx = db.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx === -1) throw new Error('Order not found');

    const order = db.orders[idx];
    const nowIso = new Date().toISOString();
    const payAmt = Math.max(0, parseFloat(String(dto.amount)) || 0);

    if (!order.payments) order.payments = [];
    order.payments.push({
      id: `pay-${Date.now()}`,
      amount: payAmt.toFixed(2),
      paymentMethod: dto.paymentMethod || 'CASH',
      transactionRef: dto.transactionRef,
      notes: dto.notes,
      receivedAt: dto.receivedAt || nowIso,
    });

    const totalPaid = order.payments.reduce(
      (acc, p) => acc + (parseFloat(String(p.amount)) || 0),
      0
    );
    const finalTotal = parseFloat(String(order.finalTotal)) || 0;
    order.balanceDue = Math.max(0, finalTotal - totalPaid).toFixed(2);
    order.updatedAt = nowIso;

    db.orders[idx] = order;
    await writeDb(db);
    return hydrateOrder(order, db.customers);
  },

  async retryWhatsAppMessage(messageId: string): Promise<WhatsAppNotification | null> {
    const db = await readDb();
    const nowIso = new Date().toISOString();
    for (const ord of db.orders) {
      const msg = ord.whatsappMessages?.find((m) => m.id === messageId);
      if (msg) {
        msg.status = db.designer.whatsappSandboxMode === false && db.designer.whatsappAccessToken ? 'SENT' : 'MOCK_SENT';
        msg.sentAt = nowIso;
        await writeDb(db);
        return msg;
      }
    }
    return null;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const db = await readDb();
    const todayStr = new Date().toISOString().split('T')[0];

    let ordersReceivedToday = 0;
    let pendingOrders = 0;
    let inProgressOrders = 0;
    let completedOrders = 0;
    let deliveredOrders = 0;
    let totalOutstanding = 0;
    let totalRevenue = 0;

    for (const ord of db.orders) {
      if (ord.createdAt.startsWith(todayStr)) {
        ordersReceivedToday += 1;
      }
      if (ord.status === 'RECEIVED') {
        pendingOrders += 1;
      } else if (ord.status === 'IN_PROGRESS') {
        inProgressOrders += 1;
      } else if (ord.status === 'COMPLETED') {
        completedOrders += 1;
      } else if (ord.status === 'DELIVERED') {
        deliveredOrders += 1;
      }

      if (ord.status !== 'CANCELLED') {
        const finalAmt = parseFloat(String(ord.finalTotal)) || 0;
        const balAmt = parseFloat(String(ord.balanceDue)) || 0;
        totalOutstanding += balAmt;
        totalRevenue += Math.max(0, finalAmt - balAmt);
      }
    }

    const recentOrders = db.orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((o) => hydrateOrder(o, db.customers));

    return {
      totalCustomers: db.customers.length,
      ordersReceivedToday,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      deliveredOrders,
      totalOutstanding: totalOutstanding.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      recentOrders,
    };
  },
};
