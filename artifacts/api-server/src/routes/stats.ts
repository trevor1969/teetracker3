import { Router } from "express";
import { db, teaSessionsTable, teaTypesTable } from "@workspace/db";
import { eq, gte, sql, and, isNotNull } from "drizzle-orm";

const router = Router();

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day + (day === 0 ? -6 : 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfMonth(d: Date) {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

router.get("/stats/overview", async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const allSessions = await db
    .select({ cups: teaSessionsTable.cups, loggedAt: teaSessionsTable.loggedAt })
    .from(teaSessionsTable);

  let today = 0, thisWeek = 0, thisMonth = 0, allTime = 0;
  let totalCupsToday = 0, totalCupsWeek = 0, totalCupsMonth = 0, totalCupsAllTime = 0;

  for (const s of allSessions) {
    const logged = new Date(s.loggedAt);
    allTime++;
    totalCupsAllTime += s.cups;
    if (logged >= monthStart) {
      thisMonth++;
      totalCupsMonth += s.cups;
    }
    if (logged >= weekStart) {
      thisWeek++;
      totalCupsWeek += s.cups;
    }
    if (logged >= todayStart) {
      today++;
      totalCupsToday += s.cups;
    }
  }

  res.json({ today, thisWeek, thisMonth, allTime, totalCupsToday, totalCupsWeek, totalCupsMonth, totalCupsAllTime });
});

router.get("/stats/by-tea", async (req, res) => {
  const sessions = await db
    .select({
      teaTypeId: teaSessionsTable.teaTypeId,
      cups: teaSessionsTable.cups,
    })
    .from(teaSessionsTable)
    .where(isNotNull(teaSessionsTable.teaTypeId));

  const types = await db.select().from(teaTypesTable);
  const typeMap = new Map(types.map(t => [t.id, t]));

  const grouped = new Map<number, { sessionCount: number; totalCups: number }>();
  for (const s of sessions) {
    if (!s.teaTypeId) continue;
    const existing = grouped.get(s.teaTypeId) ?? { sessionCount: 0, totalCups: 0 };
    existing.sessionCount++;
    existing.totalCups += s.cups;
    grouped.set(s.teaTypeId, existing);
  }

  const result = Array.from(grouped.entries())
    .map(([teaTypeId, stats]) => {
      const t = typeMap.get(teaTypeId);
      return {
        teaTypeId,
        teaTypeName: t?.name ?? "Unbekannt",
        category: t?.category ?? "",
        color: t?.color ?? null,
        sessionCount: stats.sessionCount,
        totalCups: stats.totalCups,
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount);

  res.json(result);
});

router.get("/stats/daily", async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const sessions = await db
    .select({ cups: teaSessionsTable.cups, loggedAt: teaSessionsTable.loggedAt })
    .from(teaSessionsTable)
    .where(gte(teaSessionsTable.loggedAt, thirtyDaysAgo));

  const dailyMap = new Map<string, { sessionCount: number; totalCups: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { sessionCount: 0, totalCups: 0 });
  }

  for (const s of sessions) {
    const key = new Date(s.loggedAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.sessionCount++;
      entry.totalCups += s.cups;
    }
  }

  const result = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    sessionCount: stats.sessionCount,
    totalCups: stats.totalCups,
  }));

  res.json(result);
});

export default router;
