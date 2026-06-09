import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teaTypesTable = pgTable("tea_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeaTypeSchema = createInsertSchema(teaTypesTable).omit({ id: true, createdAt: true });
export type InsertTeaType = z.infer<typeof insertTeaTypeSchema>;
export type TeaType = typeof teaTypesTable.$inferSelect;
