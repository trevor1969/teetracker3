import { useState } from "react";
import { useListTeaTypes, useDeleteTeaType, getListTeaTypesQueryKey, TeaType } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, Leaf } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeaTypeForm } from "@/components/tea-type-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TeaTypes() {
  const { data: teaTypes, isLoading } = useListTeaTypes();
  const deleteMutation = useDeleteTeaType();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirm("Möchtest du diese Teesorte wirklich löschen?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Teesorte gelöscht" });
          queryClient.invalidateQueries({ queryKey: getListTeaTypesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Teesorten</h1>
          <p className="text-muted-foreground mt-1">Verwalte deine persönliche Teesammlung.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Teesorte hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Neue Teesorte</DialogTitle>
            </DialogHeader>
            <TeaTypeForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : !teaTypes || teaTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/30">
          <Leaf className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-serif font-medium text-foreground mb-2">Noch keine Teesorten</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Füge deine erste Teesorte hinzu, um sie in deinem Tagebuch auszuwählen.
          </p>
          <Button onClick={() => setCreateOpen(true)}>Erste Teesorte anlegen</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teaTypes.map((tea) => (
            <Card key={tea.id} className="flex flex-col hover-elevate overflow-hidden border-t-4" style={{ borderTopColor: tea.color || "hsl(var(--primary))" }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-serif text-xl">{tea.name}</CardTitle>
                    <CardDescription className="mt-1">{tea.category}</CardDescription>
                  </div>
                  <div className="flex gap-1 -mt-1 -mr-2">
                    <Dialog open={editingId === tea.id} onOpenChange={(open) => setEditingId(open ? tea.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-xl">Teesorte bearbeiten</DialogTitle>
                        </DialogHeader>
                        <TeaTypeForm initialData={tea} onSuccess={() => setEditingId(null)} />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => handleDelete(tea.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {tea.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{tea.description}</p>
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
