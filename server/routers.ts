import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
  createNotification,
  markNotificationAsRead,
  getCommunicationLog,
  addCommunicationLog,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
      .query(async ({ input }) => {
        return getProducts(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProductById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          sku: z.string(),
          name: z.string(),
          description: z.string().optional(),
          category: z.enum(["machinery", "spare_parts"]),
          type: z.string().optional(),
          specifications: z.any().optional(),
          costPrice: z.string(),
          sellingPrice: z.string(),
          profitMargin: z.string().optional(),
          supplierId: z.number().optional(),
          supplierSku: z.string().optional(),
          currentStock: z.number().optional(),
          reorderPoint: z.number().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return createProduct(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          updates: z.any(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return updateProduct(input.id, input.updates);
      }),
  }),

  suppliers: router({
    list: protectedProcedure
      .input(
        z.object({
          isActive: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        return getSuppliers(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSupplierById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          country: z.string().optional(),
          website: z.string().optional(),
          contactPerson: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          minimumOrderQuantity: z.number().optional(),
          leadTime: z.number().optional(),
          reliabilityScore: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return createSupplier(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          updates: z.any(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return updateSupplier(input.id, input.updates);
      }),
  }),

  customers: router({
    list: protectedProcedure
      .input(
        z.object({
          type: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        return getCustomers(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCustomerById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          type: z.enum(["hotel", "hospital", "laundry", "maintenance_manager", "other"]),
          contactPerson: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          country: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return createCustomer(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          updates: z.any(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return updateCustomer(input.id, input.updates);
      }),
  }),

  quotations: router({
    list: protectedProcedure
      .input(
        z.object({
          customerId: z.number().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return getQuotations(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getQuotationById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          quotationNumber: z.string(),
          customerId: z.number(),
          items: z.any(),
          totalAmount: z.string().optional(),
          currency: z.string().optional(),
          validUntil: z.date().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return createQuotation(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          updates: z.any(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return updateQuotation(input.id, input.updates);
      }),
  }),

  orders: router({
    list: protectedProcedure
      .input(
        z.object({
          customerId: z.number().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return getOrders(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrderById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          customerId: z.number(),
          quotationId: z.number().optional(),
          items: z.any(),
          totalAmount: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return createOrder(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          updates: z.any(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return updateOrder(input.id, input.updates);
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(
        z.object({
          isRead: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return getNotifications(ctx.user.id, input);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return markNotificationAsRead(input.id);
      }),
  }),

  communication: router({
    getLog: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return getCommunicationLog(input.customerId);
      }),

    addLog: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          type: z.enum(["email", "whatsapp", "linkedin", "facebook", "instagram", "phone", "in_app"]),
          direction: z.enum(["outbound", "inbound"]),
          subject: z.string().optional(),
          message: z.string().optional(),
          status: z.enum(["sent", "delivered", "read", "replied", "failed"]).optional(),
          agentType: z.enum(["outreach_agent", "support_agent", "manual"]).optional(),
          sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return addCommunicationLog(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
