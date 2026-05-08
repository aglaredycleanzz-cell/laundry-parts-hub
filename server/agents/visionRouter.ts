import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { aiAgentTasks, imageRecognitionCache } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { analyzeFault, identifyPart } from "./visionAgent";

const imageUrlInput = z.object({
  imageUrl: z.string().url().max(500),
});

const faultInput = z.object({
  description: z.string().min(3).max(2000),
  imageUrl: z.string().url().max(500).optional(),
});

export const visionRouter = router({
  identifyPart: protectedProcedure
    .input(imageUrlInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      if (db) {
        const cached = await db
          .select()
          .from(imageRecognitionCache)
          .where(eq(imageRecognitionCache.imageUrl, input.imageUrl))
          .limit(1);
        if (cached.length > 0) {
          return {
            cached: true,
            result: cached[0].recognizedParts,
            confidence: cached[0].confidence,
          };
        }
      }

      try {
        const result = await identifyPart(input.imageUrl);

        if (db) {
          await db.insert(imageRecognitionCache).values({
            imageUrl: input.imageUrl,
            recognizedParts: result,
            confidence: result.confidence.toFixed(2),
            uploadedBy: ctx.user.id,
          });

          await db.insert(aiAgentTasks).values({
            agentType: "support",
            taskType: "vision_identify_part",
            status: "completed",
            input: { imageUrl: input.imageUrl },
            output: result,
            executedAt: new Date(),
            completedAt: new Date(),
          });
        }

        return { cached: false, result, confidence: result.confidence };
      } catch (error) {
        if (db) {
          await db.insert(aiAgentTasks).values({
            agentType: "support",
            taskType: "vision_identify_part",
            status: "failed",
            input: { imageUrl: input.imageUrl },
            error: error instanceof Error ? error.message : String(error),
            executedAt: new Date(),
            completedAt: new Date(),
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Vision agent failed",
        });
      }
    }),

  analyzeFault: protectedProcedure
    .input(faultInput)
    .mutation(async ({ input }) => {
      try {
        return await analyzeFault(input.description, input.imageUrl);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Fault analysis failed",
        });
      }
    }),
});
