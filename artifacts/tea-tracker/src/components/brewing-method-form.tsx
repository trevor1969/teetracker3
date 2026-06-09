import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBrewingMethod, useUpdateBrewingMethod, getListBrewingMethodsQueryKey, BrewingMethod } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  temperatureCelsius: z.coerce.number().optional().or(z.literal("")),
  steepTimeSeconds: z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BrewingMethodFormProps {
  initialData?: BrewingMethod;
  onSuccess?: () => void;
}

export function BrewingMethodForm({ initialData, onSuccess }: BrewingMethodFormProps) {
  const createMutation = useCreateBrewingMethod();
  const updateMutation = useUpdateBrewingMethod();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      temperatureCelsius: initialData?.temperatureCelsius || "",
      steepTimeSeconds: initialData?.steepTimeSeconds || "",
      description: initialData?.description || "",
    },
  });

  function onSubmit(values: FormValues) {
    const data = {
      name: values.name,
      temperatureCelsius: values.temperatureCelsius ? Number(values.temperatureCelsius) : undefined,
      steepTimeSeconds: values.steepTimeSeconds ? Number(values.steepTimeSeconds) : undefined,
      description: values.description || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({
        id: initialData.id,
        data
      }, {
        onSuccess: () => {
          toast({ title: "Brauart aktualisiert" });
          queryClient.invalidateQueries({ queryKey: getListBrewingMethodsQueryKey() });
          onSuccess?.();
        },
        onError: () => toast({ title: "Fehler beim Speichern", variant: "destructive" })
      });
    } else {
      createMutation.mutate({
        data
      }, {
        onSuccess: () => {
          toast({ title: "Brauart erstellt" });
          queryClient.invalidateQueries({ queryKey: getListBrewingMethodsQueryKey() });
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
                <Input placeholder="z.B. Gong Fu Cha, French Press..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="temperatureCelsius"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatur (°C)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="z.B. 80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="steepTimeSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ziehzeit (Sekunden)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="z.B. 120" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Besondere Hinweise..." {...field} />
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
