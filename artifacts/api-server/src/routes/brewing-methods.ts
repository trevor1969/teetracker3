import { Router } from "express";
import { db, brewingMethodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateBrewingMethodBody,
  UpdateBrewingMethodBody,
  GetBrewingMethodParams,
  UpdateBrewingMethodParams,
  DeleteBrewingMethodParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/brewing-methods", async (req, res) => {
  const methods = await db.select().from(brewingMethodsTable).orderBy(brewingMethodsTable.createdAt);
  res.json(methods.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/brewing-methods", async (req, res) => {
  const parsed = CreateBrewingMethodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [created] = await db.insert(brewingMethodsTable).values(parsed.data).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.get("/brewing-methods/:id", async (req, res) => {
  const params = GetBrewingMethodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [method] = await db.select().from(brewingMethodsTable).where(eq(brewingMethodsTable.id, params.data.id));
  if (!method) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...method, createdAt: method.createdAt.toISOString() });
});

router.patch("/brewing-methods/:id", async (req, res) => {
  const params = UpdateBrewingMethodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateBrewingMethodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(brewingMethodsTable)
    .set(parsed.data)
    .where(eq(brewingMethodsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/brewing-methods/:id", async (req, res) => {
  const params = DeleteBrewingMethodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(brewingMethodsTable).where(eq(brewingMethodsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
