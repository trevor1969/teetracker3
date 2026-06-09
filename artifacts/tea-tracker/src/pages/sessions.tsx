import { useState } from "react";
import { useListTeaSessions, useDeleteTeaSession, getListTeaSessionsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Coffee, Droplets, Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SessionForm } from "@/components/session-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Sessions() {
  const { data: sessions, isLoading } = useListTeaSessions();
  const deleteMutation = useDeleteTeaSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleDelete = (id: number) => {
    if (confirm("Möchtest du diese Session wirklich löschen?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Session gelöscht" });
          queryClient.invalidateQueries({ queryKey: getListTeaSessionsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Tagebuch</h1>
          <p className="text-muted-foreground mt-1">Alle deine Tee-Sessions auf einen Blick.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
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

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/30">
          <Coffee className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-serif font-medium text-foreground mb-2">Dein Tagebuch ist leer</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Trage deine erste Tee-Session ein, um den Überblick über deinen Konsum zu behalten.
          </p>
          <Button onClick={() => setOpen(true)}>Erste Session eintragen</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden hover-elevate transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {session.teaType?.color && (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: session.teaType.color }} />
                      )}
                      <span className="font-serif text-xl font-medium text-foreground">
                        {session.teaType?.name || "Unbekannter Tee"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(session.loggedAt), "dd. MMM yyyy, HH:mm", { locale: de })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center bg-secondary/50 px-2.5 py-1 rounded-md text-secondary-foreground font-medium">
                      <Coffee className="w-4 h-4 mr-1.5" />
                      {session.cups} {session.cups === 1 ? 'Tasse' : 'Tassen'}
                    </span>
                    
                    {session.brewingMethod && (
                      <span className="flex items-center bg-secondary/50 px-2.5 py-1 rounded-md text-secondary-foreground font-medium">
                        <Droplets className="w-4 h-4 mr-1.5" />
                        {session.brewingMethod.name}
                      </span>
                    )}
                    
                    {session.teaType?.category && (
                      <span className="bg-muted px-2.5 py-1 rounded-md font-medium">
                        {session.teaType.category}
                      </span>
                    )}
                  </div>
                  
                  {session.notes && (
                    <p className="text-sm italic text-muted-foreground/90 pl-3 border-l-2 border-primary/30 mt-3 py-1">
                      "{session.notes}"
                    </p>
                  )}
                </div>
                <div className="bg-muted/30 p-4 sm:p-5 flex justify-end sm:border-l sm:h-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Löschen</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
