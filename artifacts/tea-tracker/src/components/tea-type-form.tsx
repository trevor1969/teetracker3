import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTeaType, useUpdateTeaType, getListTeaTypesQueryKey, TeaType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const categories = [
  "Grüner Tee",
  "Schwarzer Tee",
  "Kräutertee",
  "Weißer Tee",
  "Oolong",
  "Rooibos",
  "Sonstiges",
];

interface TeaTypeFormProps {
  initialData?: TeaType;
  onSuccess?: () => void;
}

export function TeaTypeForm({ initialData, onSuccess }: TeaTypeFormProps) {
  const createMutation = useCreateTeaType();
  const updateMutation = useUpdateTeaType();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || categories[0],
      description: initialData?.description || "",
      color: initialData?.color || "#e0cdb8",
    },
  });

  function onSubmit(values: FormValues) {
    if (isEditing) {
      updateMutation.mutate({
        id: initialData.id,
        data: values
      }, {
        onSuccess: () => {
          toast({ title: "Teesorte aktualisiert" });
          queryClient.invalidateQueries({ queryKey: getListTeaTypesQueryKey() });
          onSuccess?.();
        },
        onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" })
      });
    } else {
      createMutation.mutate({
        data: values
      }, {
        onSuccess: () => {
          toast({ title: "Teesorte erstellt" });
          queryClient.invalidateQueries({ queryKey: getListTeaTypesQueryKey() });
          form.reset();
          onSuccess?.();
        },
        onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" })
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Sencha, Earl Grey..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Kategorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Geschmack, Herkunft..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farbe (für Statistiken)</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input type="color" className="w-16 p-1 h-10" {...field} />
                  <Input type="text" className="flex-1" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Aktualisieren" : "Erstellen"}
        </Button>
      </form>
    </Form>
  );
}
