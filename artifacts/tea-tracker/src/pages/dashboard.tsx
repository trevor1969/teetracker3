import { useGetStatsOverview, useListTeaSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Coffee, CupSoda, Droplets, Clock, Loader2, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SessionForm } from "@/components/session-form";
import { useState } from "react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsOverview();
  const { data: sessions, isLoading: sessionsLoading } = useListTeaSessions({ query: { limit: 5 } });
  const [open, setOpen] = useState(false);

  if (statsLoading || sessionsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Guten Tag.</h1>
          <p className="text-muted-foreground mt-1 text-lg">Dein Tee-Journal wartet auf den nächsten Eintrag.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-sm hover-elevate">
              <Plus className="mr-2 h-5 w-5" />
              Tee eintragen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Neuen Tee eintragen</DialogTitle>
            </DialogHeader>
            <SessionForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heute</CardTitle>
            <Coffee className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-primary">{stats?.totalCupsToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tassen in {stats?.today || 0} Sessions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
            <Clock className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-primary">{stats?.totalCupsWeek || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tassen in {stats?.thisWeek || 0} Sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dieser Monat</CardTitle>
            <Droplets className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-primary">{stats?.totalCupsMonth || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tassen in {stats?.thisMonth || 0} Sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time</CardTitle>
            <CupSoda className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif text-primary">{stats?.totalCupsAllTime || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tassen in {stats?.allTime || 0} Sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold">Letzte Sessions</h2>
          <Link href="/sessions" className="text-sm text-primary hover:underline">
            Alle ansehen
          </Link>
        </div>

        {sessions?.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center bg-card/30">
            <Coffee className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Noch keine Einträge</h3>
            <p className="text-sm text-muted-foreground mb-4">Zeit für eine Tasse Tee!</p>
            <Button variant="outline" onClick={() => setOpen(true)}>Erste Session eintragen</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions?.map((session) => (
              <Card key={session.id} className="overflow-hidden hover-elevate transition-shadow duration-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-1 p-4 sm:px-6">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {session.teaType?.color && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: session.teaType.color }} />
                        )}
                        <span className="font-medium text-foreground text-lg">
                          {session.teaType?.name || "Unbekannter Tee"}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(parseISO(session.loggedAt), "dd. MMM, HH:mm", { locale: de })}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center bg-secondary/50 px-2 py-0.5 rounded-md text-secondary-foreground">
                        <Coffee className="w-3.5 h-3.5 mr-1" />
                        {session.cups} {session.cups === 1 ? 'Tasse' : 'Tassen'}
                      </span>
                      
                      {session.brewingMethod && (
                        <span className="flex items-center bg-secondary/50 px-2 py-0.5 rounded-md text-secondary-foreground">
                          <Droplets className="w-3.5 h-3.5 mr-1" />
                          {session.brewingMethod.name}
                        </span>
                      )}
                      
                      {session.teaType?.category && (
                        <span className="bg-muted px-2 py-0.5 rounded-md">
                          {session.teaType.category}
                        </span>
                      )}
                    </div>
                    
                    {session.notes && (
                      <p className="mt-3 text-sm italic text-muted-foreground/80 pl-3 border-l-2 border-primary/20">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
