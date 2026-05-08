import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  datetime,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for admin and user roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table: stores both machinery and spare parts
 * Includes pricing, specifications, and profit margin tracking
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    sku: varchar("sku", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", ["machinery", "spare_parts"]).notNull(),
    type: varchar("type", { length: 100 }), // e.g., "washer", "dryer", "valve", "pump"
    specifications: json("specifications"), // JSON for flexible specs storage
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }).notNull(), // USD
    sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }).notNull(), // OMR
    profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }), // Percentage
    supplierId: int("supplierId"),
    supplierSku: varchar("supplierSku", { length: 100 }),
    currentStock: int("currentStock").default(0),
    reorderPoint: int("reorderPoint").default(10),
    imageUrl: varchar("imageUrl", { length: 500 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    skuIndex: index("sku_idx").on(table.sku),
    categoryIndex: index("category_idx").on(table.category),
    supplierIndex: index("supplier_idx").on(table.supplierId),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Suppliers table: stores information about Chinese suppliers and local distributors
 */
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    country: varchar("country", { length: 100 }),
    website: varchar("website", { length: 500 }),
    contactPerson: varchar("contactPerson", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    whatsapp: varchar("whatsapp", { length: 20 }),
    minimumOrderQuantity: int("minimumOrderQuantity").default(1),
    leadTime: int("leadTime"), // Days
    reliabilityScore: decimal("reliabilityScore", { precision: 3, scale: 2 }), // 0-5
    lastPriceUpdate: timestamp("lastPriceUpdate"),
    notes: text("notes"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIndex: index("supplier_name_idx").on(table.name),
  })
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Customers table: stores hotel, hospital, and maintenance manager information
 */
export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["hotel", "hospital", "laundry", "maintenance_manager", "other"]).notNull(),
    contactPerson: varchar("contactPerson", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    whatsapp: varchar("whatsapp", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),
    engagementScore: decimal("engagementScore", { precision: 3, scale: 2 }).default("0"), // 0-100
    lastContactDate: timestamp("lastContactDate"),
    communicationChannel: mysqlEnum("communicationChannel", ["email", "whatsapp", "linkedin", "phone", "other"]),
    notes: text("notes"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIndex: index("customer_name_idx").on(table.name),
    typeIndex: index("customer_type_idx").on(table.type),
    emailIndex: index("customer_email_idx").on(table.email),
  })
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Quotations table: stores quotation requests and their status
 */
export const quotations = mysqlTable(
  "quotations",
  {
    id: int("id").autoincrement().primaryKey(),
    quotationNumber: varchar("quotationNumber", { length: 50 }).notNull().unique(),
    customerId: int("customerId").notNull(),
    status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "rejected", "expired"]).default("draft"),
    items: json("items"), // Array of {productId, quantity, price}
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("OMR"),
    validUntil: timestamp("validUntil"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    sentAt: timestamp("sentAt"),
    viewedAt: timestamp("viewedAt"),
  },
  (table) => ({
    customerIndex: index("quotation_customer_idx").on(table.customerId),
    statusIndex: index("quotation_status_idx").on(table.status),
  })
);

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

/**
 * Orders table: stores confirmed purchase orders
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    customerId: int("customerId").notNull(),
    quotationId: int("quotationId"),
    status: mysqlEnum("status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]).default("pending"),
    items: json("items"), // Array of {productId, quantity, price}
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
    paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid", "overdue"]).default("pending"),
    deliveryDate: timestamp("deliveryDate"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    customerIndex: index("order_customer_idx").on(table.customerId),
    statusIndex: index("order_status_idx").on(table.status),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Inventory table: tracks stock levels and reorder history
 */
export const inventory = mysqlTable(
  "inventory",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    lastRestockDate: timestamp("lastRestockDate"),
    reorderStatus: mysqlEnum("reorderStatus", ["in_stock", "low_stock", "out_of_stock", "on_order"]).default("in_stock"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productIndex: index("inventory_product_idx").on(table.productId),
  })
);

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Pricing history table: tracks price changes over time for analytics
 */
export const pricingHistory = mysqlTable(
  "pricing_history",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    supplierId: int("supplierId"),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }),
    sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }),
    profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }),
    changeReason: varchar("changeReason", { length: 255 }), // e.g., "supplier_price_drop", "market_adjustment"
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    productIndex: index("pricing_product_idx").on(table.productId),
  })
);

export type PricingHistory = typeof pricingHistory.$inferSelect;
export type InsertPricingHistory = typeof pricingHistory.$inferInsert;

/**
 * Communication log table: tracks all outreach attempts, responses, and engagement
 */
export const communicationLog = mysqlTable(
  "communication_log",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull(),
    type: mysqlEnum("type", ["email", "whatsapp", "linkedin", "facebook", "instagram", "phone", "in_app"]).notNull(),
    direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
    subject: varchar("subject", { length: 255 }),
    message: text("message"),
    status: mysqlEnum("status", ["sent", "delivered", "read", "replied", "failed"]).default("sent"),
    agentType: mysqlEnum("agentType", ["outreach_agent", "support_agent", "manual"]).default("manual"),
    responseTime: int("responseTime"), // Minutes
    sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    customerIndex: index("comm_customer_idx").on(table.customerId),
    typeIndex: index("comm_type_idx").on(table.type),
  })
);

export type CommunicationLog = typeof communicationLog.$inferSelect;
export type InsertCommunicationLog = typeof communicationLog.$inferInsert;

/**
 * Notifications table: stores system notifications for the owner
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", [
      "quotation_request",
      "low_inventory",
      "high_profit_opportunity",
      "customer_engagement",
      "supplier_price_update",
      "order_status_update",
      "agent_alert",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    relatedEntityType: varchar("relatedEntityType", { length: 50 }), // e.g., "quotation", "product", "customer"
    relatedEntityId: int("relatedEntityId"),
    isRead: boolean("isRead").default(false),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    channels: json("channels"), // Array of notification channels: ["email", "in_app", "sms"]
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  (table) => ({
    userIndex: index("notif_user_idx").on(table.userId),
    typeIndex: index("notif_type_idx").on(table.type),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * AI Agent tasks table: tracks scheduled and completed AI agent tasks
 */
export const aiAgentTasks = mysqlTable(
  "ai_agent_tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    agentType: mysqlEnum("agentType", ["sourcing", "outreach", "support", "analytics"]).notNull(),
    taskType: varchar("taskType", { length: 100 }).notNull(), // e.g., "price_monitoring", "customer_outreach"
    status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
    input: json("input"), // Task input parameters
    output: json("output"), // Task results
    error: text("error"),
    executedAt: timestamp("executedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    agentIndex: index("task_agent_idx").on(table.agentType),
    statusIndex: index("task_status_idx").on(table.status),
  })
);

export type AIAgentTask = typeof aiAgentTasks.$inferSelect;
export type InsertAIAgentTask = typeof aiAgentTasks.$inferInsert;

/**
 * Image recognition cache table: stores recognized parts from uploaded images
 */
export const imageRecognitionCache = mysqlTable(
  "image_recognition_cache",
  {
    id: int("id").autoincrement().primaryKey(),
    imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
    recognizedParts: json("recognizedParts"), // Array of {productId, confidence, matchedSpecs}
    confidence: decimal("confidence", { precision: 3, scale: 2 }),
    uploadedBy: int("uploadedBy"),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  },
  (table) => ({
    imageIndex: index("image_url_idx").on(table.imageUrl),
  })
);

export type ImageRecognitionCache = typeof imageRecognitionCache.$inferSelect;
export type InsertImageRecognitionCache = typeof imageRecognitionCache.$inferInsert;

/**
 * Analytics events table: tracks user interactions and system events for analytics
 */
export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: int("id").autoincrement().primaryKey(),
    eventType: varchar("eventType", { length: 100 }).notNull(), // e.g., "quotation_created", "product_viewed"
    userId: int("userId"),
    customerId: int("customerId"),
    productId: int("productId"),
    metadata: json("metadata"), // Additional event data
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    eventIndex: index("event_type_idx").on(table.eventType),
    userIndex: index("event_user_idx").on(table.userId),
  })
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
