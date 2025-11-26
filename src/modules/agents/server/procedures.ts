import { db } from "@/db";
import { agents } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";
import { eq } from "drizzle-orm";
// import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({
  // TODO : Change 'getOne' to use 'protected procedure'
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgents] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id));
      return existingAgents;
    }),
  // TODO : Change 'getMany' to use 'protected procedure'
  getMany: protectedProcedure.query(async () => {
    const data = await db.select().from(agents);
    // throw new TRPCError({ code: "NOT_FOUND" });
    return data;
  }),
  create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdAgent] = await db
        .insert(agents)
        .values({ ...input, userId: ctx.auth.user.id })
        .returning();

      return createdAgent;
    }),
});
