import { useState } from "react";
import { useListBrewingMethods, useDeleteBrewingMethod, getListBrewingMethodsQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, Droplets, Thermometer, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BrewingMethodForm } from "@/components/brewing-method-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function BrewingMethods() {
  const { data: methods, isLoading } = useListBrewingMethods();
  const deleteMutation = useDeleteBrewingMethod();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirm("Möchtest du diese Brauart wirklich löschen?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Brauart gelöscht" });
          queryClient.invalidateQueries({ queryKey: getListBrewingMethodsQueryKey() });
        }
      });
    }
  };

  const formatTime = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
    if (mins > 0) return `${mins} min`;
    return `${secs} s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Brauarten</h1>
          <p className="text-muted-foreground mt-1">Definiere deine Zubereitungsmethoden.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Brauart hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Neue Brauart</DialogTitle>
            </DialogHeader>
            <BrewingMethodForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : !methods || methods.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/30">
          <Droplets className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-serif font-medium text-foreground mb-2">Noch keine Brauarten</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Füge Methoden wie "Gong Fu Cha" oder "Teekanne" hinzu.
          </p>
          <Button onClick={() => setCreateOpen(true)}>Erste Brauart anlegen</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <Card key={method.id} className="flex flex-col hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-serif text-xl">{method.name}</CardTitle>
                  <div className="flex gap-1 -mt-1 -mr-2">
                    <Dialog open={editingId === method.id} onOpenChange={(open) => setEditingId(open ? method.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-xl">Brauart bearbeiten</DialogTitle>
                        </DialogHeader>
                        <BrewingMethodForm initialData={method} onSuccess={() => setEditingId(null)} />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-3">
                  {method.temperatureCelsius && (
                    <div className="flex items-center text-sm text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-md">
                      <Thermometer className="w-4 h-4 mr-1.5" />
                      {method.temperatureCelsius} °C
                    </div>
                  )}
                  {method.steepTimeSeconds && (
                    <div className="flex items-center text-sm text-secondary-foreground font-medium bg-secondary/50 px-2.5 py-1 rounded-md">
                      <Timer className="w-4 h-4 mr-1.5" />
                      {formatTime(method.steepTimeSeconds)}
                    </div>
                  )}
                </div>
                
                {method.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{method.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">Keine Beschreibung</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
