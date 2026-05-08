import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { visionRouter } from "./agents/visionRouter";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  getNotifications,
  markNotificationAsRead,
  getCommunicationLog,
  addCommunicationLog,
} from "./db";

const decimalString = z
  .string()
  .regex(/^-?\d+(\.\d{1,4})?$/, "Invalid decimal value");

const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code");

const emailField = z.string().email().max(320);
const phoneField = z.string().min(3).max(20);

const quotationItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: decimalString,
});

const productUpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    type: z.string().max(100).optional(),
    specifications: z.record(z.string(), z.unknown()).optional(),
    costPrice: decimalString.optional(),
    costCurrency: currencyCode.optional(),
    sellingPrice: decimalString.optional(),
    sellingCurrency: currencyCode.optional(),
    profitMargin: decimalString.optional(),
    supplierId: z.number().int().positive().optional(),
    supplierSku: z.string().max(100).optional(),
    currentStock: z.number().int().min(0).optional(),
    reorderPoint: z.number().int().min(0).optional(),
    imageUrl: z.string().url().max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const supplierUpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    country: z.string().max(100).optional(),
    website: z.string().url().max(500).optional(),
    contactPerson: z.string().max(255).optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
    whatsapp: phoneField.optional(),
    minimumOrderQuantity: z.number().int().min(1).optional(),
    leadTime: z.number().int().min(0).optional(),
    reliabilityScore: decimalString.optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const customerUpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(["hotel", "hospital", "laundry", "maintenance_manager", "other"]).optional(),
    contactPerson: z.string().max(255).optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
    whatsapp: phoneField.optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const quotationUpdateSchema = z
  .object({
    status: z.enum(["draft", "sent", "viewed", "accepted", "rejected", "expired"]).optional(),
    items: z.array(quotationItemSchema).optional(),
    totalAmount: decimalString.optional(),
    currency: currencyCode.optional(),
    validUntil: z.date().optional(),
    notes: z.string().optional(),
  })
  .strict();

const orderUpdateSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
    paymentStatus: z.enum(["pending", "partial", "paid", "overdue"]).optional(),
    items: z.array(quotationItemSchema).optional(),
    totalAmount: decimalString.optional(),
    deliveryDate: z.date().optional(),
    notes: z.string().optional(),
  })
  .strict();

export const appRouter = router({
  system: systemRouter,
  vision: visionRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    list: protectedProcedure
      .input(
        z.object({
          category: z.enum(["machinery", "spare_parts"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .query(({ input }) => getProducts(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getProductById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          sku: z.string().min(1).max(50),
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.enum(["machinery", "spare_parts"]),
          type: z.string().max(100).optional(),
          specifications: z.record(z.string(), z.unknown()).optional(),
          costPrice: decimalString,
          costCurrency: currencyCode.default("USD"),
          sellingPrice: decimalString,
          sellingCurrency: currencyCode.default("OMR"),
          profitMargin: decimalString.optional(),
          supplierId: z.number().int().positive().optional(),
          supplierSku: z.string().max(100).optional(),
          currentStock: z.number().int().min(0).optional(),
          reorderPoint: z.number().int().min(0).optional(),
          imageUrl: z.string().url().max(500).optional(),
        })
      )
      .mutation(({ input }) => createProduct(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          updates: productUpdateSchema,
        })
      )
      .mutation(({ input }) => updateProduct(input.id, input.updates)),
  }),

  suppliers: router({
    list: protectedProcedure
      .input(z.object({ isActive: z.boolean().optional() }))
      .query(({ input }) => getSuppliers(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getSupplierById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          country: z.string().max(100).optional(),
          website: z.string().url().max(500).optional(),
          contactPerson: z.string().max(255).optional(),
          email: emailField.optional(),
          phone: phoneField.optional(),
          whatsapp: phoneField.optional(),
          minimumOrderQuantity: z.number().int().min(1).optional(),
          leadTime: z.number().int().min(0).optional(),
          reliabilityScore: decimalString.optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => createSupplier(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          updates: supplierUpdateSchema,
        })
      )
      .mutation(({ input }) => updateSupplier(input.id, input.updates)),
  }),

  customers: router({
    list: protectedProcedure
      .input(
        z.object({
          type: z.enum(["hotel", "hospital", "laundry", "maintenance_manager", "other"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .query(({ input }) => getCustomers(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getCustomerById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          type: z.enum(["hotel", "hospital", "laundry", "maintenance_manager", "other"]),
          contactPerson: z.string().max(255).optional(),
          email: emailField.optional(),
          phone: phoneField.optional(),
          whatsapp: phoneField.optional(),
          address: z.string().optional(),
          city: z.string().max(100).optional(),
          country: z.string().max(100).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => createCustomer(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          updates: customerUpdateSchema,
        })
      )
      .mutation(({ input }) => updateCustomer(input.id, input.updates)),
  }),

  quotations: router({
    list: protectedProcedure
      .input(
        z.object({
          customerId: z.number().int().positive().optional(),
          status: z.enum(["draft", "sent", "viewed", "accepted", "rejected", "expired"]).optional(),
        })
      )
      .query(({ input }) => getQuotations(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getQuotationById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          quotationNumber: z.string().min(1).max(50),
          customerId: z.number().int().positive(),
          items: z.array(quotationItemSchema).min(1),
          totalAmount: decimalString.optional(),
          currency: currencyCode.default("OMR"),
          validUntil: z.date().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => createQuotation(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          updates: quotationUpdateSchema,
        })
      )
      .mutation(({ input }) => updateQuotation(input.id, input.updates)),
  }),

  orders: router({
    list: protectedProcedure
      .input(
        z.object({
          customerId: z.number().int().positive().optional(),
          status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
        })
      )
      .query(({ input }) => getOrders(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getOrderById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          orderNumber: z.string().min(1).max(50),
          customerId: z.number().int().positive(),
          quotationId: z.number().int().positive().optional(),
          items: z.array(quotationItemSchema).min(1),
          totalAmount: decimalString.optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => createOrder(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          updates: orderUpdateSchema,
        })
      )
      .mutation(({ input }) => updateOrder(input.id, input.updates)),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ isRead: z.boolean().optional() }))
      .query(({ input, ctx }) => getNotifications(ctx.user.id, input)),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => markNotificationAsRead(input.id)),
  }),

  communication: router({
    getLog: protectedProcedure
      .input(z.object({ customerId: z.number().int().positive() }))
      .query(({ input }) => getCommunicationLog(input.customerId)),

    addLog: adminProcedure
      .input(
        z.object({
          customerId: z.number().int().positive(),
          type: z.enum(["email", "whatsapp", "linkedin", "facebook", "instagram", "phone", "in_app"]),
          direction: z.enum(["outbound", "inbound"]),
          subject: z.string().max(255).optional(),
          message: z.string().optional(),
          status: z.enum(["sent", "delivered", "read", "replied", "failed"]).optional(),
          agentType: z.enum(["outreach_agent", "support_agent", "manual"]).optional(),
          sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        })
      )
      .mutation(({ input }) => addCommunicationLog(input)),
  }),
});

export type AppRouter = typeof appRouter;
