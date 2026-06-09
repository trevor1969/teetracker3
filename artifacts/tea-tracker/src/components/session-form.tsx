import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListTeaTypes, useListBrewingMethods, useCreateTeaSession, getListTeaSessionsQueryKey, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  teaTypeId: z.string().optional(),
  brewingMethodId: z.string().optional(),
  cups: z.coerce.number().min(1, "Bitte mindestens eine Tasse angeben"),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SessionForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: teaTypes } = useListTeaTypes();
  const { data: brewingMethods } = useListBrewingMethods();
  const createSession = useCreateTeaSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cups: 1,
      notes: "",
      teaTypeId: "none",
      brewingMethodId: "none",
      loggedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  function onSubmit(values: FormValues) {
    createSession.mutate({
      data: {
        cups: values.cups,
        notes: values.notes || undefined,
        teaTypeId: values.teaTypeId && values.teaTypeId !== "none" ? parseInt(values.teaTypeId, 10) : undefined,
        brewingMethodId: values.brewingMethodId && values.brewingMethodId !== "none" ? parseInt(values.brewingMethodId, 10) : undefined,
        loggedAt: values.loggedAt ? new Date(values.loggedAt).toISOString() : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Tee-Session gespeichert!" });
        queryClient.invalidateQueries({ queryKey: getListTeaSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        toast({ title: "Fehler beim Speichern", variant: "destructive" });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="teaTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teesorte</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Teesorte" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  {teaTypes?.map((tea) => (
                    <SelectItem key={tea.id} value={tea.id.toString()}>
                      {tea.name}
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
          name="brewingMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brauart</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Brauart" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  {brewingMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cups"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tassen</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loggedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zeitpunkt</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea placeholder="Wie war der Tee?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createSession.isPending} className="w-full">
          {createSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Eintragen
        </Button>
      </form>
    </Form>
  );
}
