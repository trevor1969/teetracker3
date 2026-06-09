import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brewingMethodsTable = pgTable("brewing_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  temperatureCelsius: integer("temperature_celsius"),
  steepTimeSeconds: integer("steep_time_seconds"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBrewingMethodSchema = createInsertSchema(brewingMethodsTable).omit({ id: true, createdAt: true });
export type InsertBrewingMethod = z.infer<typeof insertBrewingMethodSchema>;
export type BrewingMethod = typeof brewingMethodsTable.$inferSelect;
