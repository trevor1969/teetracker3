import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teaTypesTable } from "./tea-types";
import { brewingMethodsTable } from "./brewing-methods";

export const teaSessionsTable = pgTable("tea_sessions", {
  id: serial("id").primaryKey(),
  teaTypeId: integer("tea_type_id").references(() => teaTypesTable.id, { onDelete: "set null" }),
  brewingMethodId: integer("brewing_method_id").references(() => brewingMethodsTable.id, { onDelete: "set null" }),
  cups: integer("cups").notNull().default(1),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeaSessionSchema = createInsertSchema(teaSessionsTable).omit({ id: true, createdAt: true });
export type InsertTeaSession = z.infer<typeof insertTeaSessionSchema>;
export type TeaSession = typeof teaSessionsTable.$inferSelect;
