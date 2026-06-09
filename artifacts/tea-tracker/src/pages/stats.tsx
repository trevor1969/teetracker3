import { useGetStatsDaily, useGetStatsByTea } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export default function Stats() {
  const { data: dailyStats, isLoading: dailyLoading } = useGetStatsDaily();
  const { data: teaStats, isLoading: teaLoading } = useGetStatsByTea();

  const isLoading = dailyLoading || teaLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const formattedDailyStats = dailyStats?.map(stat => ({
    ...stat,
    formattedDate: format(parseISO(stat.date), "dd. MMM", { locale: de }),
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Statistiken</h1>
        <p className="text-muted-foreground mt-1">Deine Tee-Gewohnheiten visualisiert.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="font-serif">Tassen pro Tag (Letzte 30 Tage)</CardTitle>
            <CardDescription>Dein Konsum im zeitlichen Verlauf</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {formattedDailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedDailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))", marginBottom: "4px" }}
                  />
                  <Bar dataKey="totalCups" name="Tassen" radius={[4, 4, 0, 0]}>
                    {formattedDailyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={entry.totalCups > 0 ? 1 : 0.2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nicht genug Daten für ein Diagramm.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Verteilung nach Teesorte</CardTitle>
            <CardDescription>Tassen pro Sorte</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {teaStats && teaStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teaStats}
                    dataKey="totalCups"
                    nameKey="teaTypeName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {teaStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "hsl(var(--primary))"} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nicht genug Daten für ein Diagramm.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Top Teesorten</CardTitle>
            <CardDescription>Meiste Tassen getrunken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teaStats && teaStats.length > 0 ? (
                teaStats.sort((a, b) => b.totalCups - a.totalCups).slice(0, 5).map((stat) => (
                  <div key={stat.teaTypeId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color || "hsl(var(--primary))" }} />
                      <span className="font-medium">{stat.teaTypeName}</span>
                    </div>
                    <div className="font-serif text-lg font-bold text-primary">
                      {stat.totalCups} <span className="text-sm font-sans font-normal text-muted-foreground">Tassen</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Noch keine Tees getrunken.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
