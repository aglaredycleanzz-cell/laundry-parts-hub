import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  suppliers,
  customers,
  quotations,
  orders,
  inventory,
  pricingHistory,
  communicationLog,
  notifications,
  aiAgentTasks,
  type Product,
  type Supplier,
  type Customer,
  type Quotation,
  type Order,
  type InsertProduct,
  type InsertSupplier,
  type InsertCustomer,
  type InsertQuotation,
  type InsertOrder,
  type InsertNotification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PRODUCTS ============

export async function getProducts(filters?: { category?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(products.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }

  if (conditions.length > 0) {
    return db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));
  }

  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProductBySku(sku: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(product);
  return result;
}

export async function updateProduct(id: number, updates: Partial<Product>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(products).set(updates).where(eq(products.id, id));
}

// ============ SUPPLIERS ============

export async function getSuppliers(filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  if (filters?.isActive !== undefined) {
    return db.select().from(suppliers).where(eq(suppliers.isActive, filters.isActive)).orderBy(desc(suppliers.createdAt));
  }

  return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(suppliers).values(supplier);
}

export async function updateSupplier(id: number, updates: Partial<Supplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(suppliers).set(updates).where(eq(suppliers.id, id));
}

// ============ CUSTOMERS ============

export async function getCustomers(filters?: { type?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(customers.type, filters.type as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(customers.isActive, filters.isActive));
  }

  if (conditions.length > 0) {
    return db.select().from(customers).where(and(...conditions)).orderBy(desc(customers.engagementScore));
  }

  return db.select().from(customers).orderBy(desc(customers.engagementScore));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(customers).values(customer);
}

export async function updateCustomer(id: number, updates: Partial<Customer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(customers).set(updates).where(eq(customers.id, id));
}

// ============ QUOTATIONS ============

export async function getQuotations(filters?: { customerId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.customerId) {
    conditions.push(eq(quotations.customerId, filters.customerId));
  }
  if (filters?.status) {
    conditions.push(eq(quotations.status, filters.status as any));
  }

  if (conditions.length > 0) {
    return db.select().from(quotations).where(and(...conditions)).orderBy(desc(quotations.createdAt));
  }

  return db.select().from(quotations).orderBy(desc(quotations.createdAt));
}

export async function getQuotationById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createQuotation(quotation: InsertQuotation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(quotations).values(quotation);
}

export async function updateQuotation(id: number, updates: Partial<Quotation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(quotations).set(updates).where(eq(quotations.id, id));
}

// ============ ORDERS ============

export async function getOrders(filters?: { customerId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.customerId) {
    conditions.push(eq(orders.customerId, filters.customerId));
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }

  if (conditions.length > 0) {
    return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
  }

  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(orders).values(order);
}

export async function updateOrder(id: number, updates: Partial<Order>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(orders).set(updates).where(eq(orders.id, id));
}

// ============ NOTIFICATIONS ============

export async function getNotifications(userId: number, filters?: { isRead?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(notifications.userId, userId)];

  if (filters?.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }

  return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

// ============ COMMUNICATION LOG ============

export async function getCommunicationLog(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(communicationLog).where(eq(communicationLog.customerId, customerId)).orderBy(desc(communicationLog.createdAt));
}

export async function addCommunicationLog(log: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(communicationLog).values(log);
}
