import { Router } from "express";
import { db, teaSessionsTable, teaTypesTable, brewingMethodsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateTeaSessionBody,
  UpdateTeaSessionBody,
  GetTeaSessionParams,
  UpdateTeaSessionParams,
  DeleteTeaSessionParams,
  ListTeaSessionsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function formatSession(s: typeof teaSessionsTable.$inferSelect & {
  teaType?: typeof teaTypesTable.$inferSelect | null;
  brewingMethod?: typeof brewingMethodsTable.$inferSelect | null;
}) {
  return {
    ...s,
    loggedAt: s.loggedAt instanceof Date ? s.loggedAt.toISOString() : s.loggedAt,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    teaType: s.teaType ? { ...s.teaType, createdAt: s.teaType.createdAt.toISOString() } : null,
    brewingMethod: s.brewingMethod ? { ...s.brewingMethod, createdAt: s.brewingMethod.createdAt.toISOString() } : null,
  };
}

router.get("/tea-sessions", async (req, res) => {
  const query = ListTeaSessionsQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  const limit = query.success && query.data.limit ? query.data.limit : 100;
  const offset = query.success && query.data.offset ? query.data.offset : 0;

  const sessions = await db
    .select()
    .from(teaSessionsTable)
    .leftJoin(teaTypesTable, eq(teaSessionsTable.teaTypeId, teaTypesTable.id))
    .leftJoin(brewingMethodsTable, eq(teaSessionsTable.brewingMethodId, brewingMethodsTable.id))
    .orderBy(desc(teaSessionsTable.loggedAt))
    .limit(limit)
    .offset(offset);

  res.json(sessions.map(row => formatSession({
    ...row.tea_sessions,
    teaType: row.tea_types ?? null,
    brewingMethod: row.brewing_methods ?? null,
  })));
});

router.post("/tea-sessions", async (req, res) => {
  const parsed = CreateTeaSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const values: typeof teaSessionsTable.$inferInsert = {
    teaTypeId: parsed.data.teaTypeId,
    brewingMethodId: parsed.data.brewingMethodId,
    cups: parsed.data.cups,
    notes: parsed.data.notes,
    loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date(),
  };
  const [created] = await db.insert(teaSessionsTable).values(values).returning();

  const [teaType] = created.teaTypeId
    ? await db.select().from(teaTypesTable).where(eq(teaTypesTable.id, created.teaTypeId))
    : [];
  const [brewingMethod] = created.brewingMethodId
    ? await db.select().from(brewingMethodsTable).where(eq(brewingMethodsTable.id, created.brewingMethodId))
    : [];

  res.status(201).json(formatSession({ ...created, teaType: teaType ?? null, brewingMethod: brewingMethod ?? null }));
});

router.get("/tea-sessions/:id", async (req, res) => {
  const params = GetTeaSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select()
    .from(teaSessionsTable)
    .leftJoin(teaTypesTable, eq(teaSessionsTable.teaTypeId, teaTypesTable.id))
    .leftJoin(brewingMethodsTable, eq(teaSessionsTable.brewingMethodId, brewingMethodsTable.id))
    .where(eq(teaSessionsTable.id, params.data.id));

  if (!rows.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const row = rows[0];
  res.json(formatSession({
    ...row.tea_sessions,
    teaType: row.tea_types ?? null,
    brewingMethod: row.brewing_methods ?? null,
  }));
});

router.patch("/tea-sessions/:id", async (req, res) => {
  const params = UpdateTeaSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTeaSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updateData: Partial<typeof teaSessionsTable.$inferInsert> = {};
  if (parsed.data.teaTypeId !== undefined) updateData.teaTypeId = parsed.data.teaTypeId;
  if (parsed.data.brewingMethodId !== undefined) updateData.brewingMethodId = parsed.data.brewingMethodId;
  if (parsed.data.cups !== undefined) updateData.cups = parsed.data.cups;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.loggedAt !== undefined) updateData.loggedAt = new Date(parsed.data.loggedAt);

  const [updated] = await db
    .update(teaSessionsTable)
    .set(updateData)
    .where(eq(teaSessionsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [teaType] = updated.teaTypeId
    ? await db.select().from(teaTypesTable).where(eq(teaTypesTable.id, updated.teaTypeId))
    : [];
  const [brewingMethod] = updated.brewingMethodId
    ? await db.select().from(brewingMethodsTable).where(eq(brewingMethodsTable.id, updated.brewingMethodId))
    : [];

  res.json(formatSession({ ...updated, teaType: teaType ?? null, brewingMethod: brewingMethod ?? null }));
});

router.delete("/tea-sessions/:id", async (req, res) => {
  const params = DeleteTeaSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(teaSessionsTable).where(eq(teaSessionsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
