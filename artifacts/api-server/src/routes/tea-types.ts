import { Router } from "express";
import { db, teaTypesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateTeaTypeBody,
  UpdateTeaTypeBody,
  GetTeaTypeParams,
  UpdateTeaTypeParams,
  DeleteTeaTypeParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/tea-types", async (req, res) => {
  const types = await db.select().from(teaTypesTable).orderBy(teaTypesTable.createdAt);
  res.json(types.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/tea-types", async (req, res) => {
  const parsed = CreateTeaTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [created] = await db.insert(teaTypesTable).values(parsed.data).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.get("/tea-types/:id", async (req, res) => {
  const params = GetTeaTypeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [type] = await db.select().from(teaTypesTable).where(eq(teaTypesTable.id, params.data.id));
  if (!type) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...type, createdAt: type.createdAt.toISOString() });
});

router.patch("/tea-types/:id", async (req, res) => {
  const params = UpdateTeaTypeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTeaTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(teaTypesTable)
    .set(parsed.data)
    .where(eq(teaTypesTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/tea-types/:id", async (req, res) => {
  const params = DeleteTeaTypeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(teaTypesTable).where(eq(teaTypesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
