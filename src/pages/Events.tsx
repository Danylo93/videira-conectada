import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventItem {
  id: string;
  title: string;
  date: string;
  price?: number | null;
  registration_link?: string | null;
}

interface EventForm {
  title: string;
  date: string;
  price: string;
  registration_link: string;
}

export function Events() {
  const { user } = useAuth();
  const location = useLocation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useForm<EventForm>({
    defaultValues: {
      title: "",
      date: "",
      price: "",
      registration_link: "",
    },
  });

  async function loadEvents() {
    setLoading(true);
    const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
    setEvents((data ?? []) as EventItem[]);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
    if (location.state?.openCreate) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: EventForm) => {
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      title: values.title,
      date: values.date,
      price: values.price ? Number(values.price) : null,
      registration_link: values.registration_link,
    });
    setSaving(false);
    if (!error) {
      setOpen(false);
      form.reset();
      loadEvents();
    }
  };

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      {user?.role === "pastor" && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Criar Evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do evento" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registration_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link de Inscrição</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      {saving ? <LoadingSpinner size={20} /> : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcoming.map((e) => (
          <Card
            key={e.id}
            className="transition-transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle>{e.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                {format(new Date(e.date), "dd 'de' MMMM yyyy", { locale: ptBR })}
              </p>
              {e.price !== null && e.price !== undefined && (
                <p className="font-medium">R$ {e.price.toFixed(2)}</p>
              )}
              {e.registration_link && (
                <Button asChild>
                  <a
                    href={e.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Inscreva-se
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Eventos Passados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map((e) => (
              <Card
                key={e.id}
                className="opacity-50 pointer-events-none"
              >
                <CardHeader>
                  <CardTitle>{e.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    {format(new Date(e.date), "dd 'de' MMMM yyyy", { locale: ptBR })}
                  </p>
                  {e.price !== null && e.price !== undefined && (
                    <p className="font-medium">R$ {e.price.toFixed(2)}</p>
                  )}
                  <Button disabled>Encerrado</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
