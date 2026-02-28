import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { getEventById } from "../services/eventService";

type SupabaseEventRow = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
  active: boolean;
};

type DashboardEvent = {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  image?: string | null;
  formUrl?: string | null;
};

const EVENTS_CACHE_KEY = "eventos";

function mapSupabaseEvents(rows: SupabaseEventRow[]): DashboardEvent[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    eventDate: row.event_date,
    startDate: row.event_date,
    endDate: row.event_date,
    location: row.location || "",
    type: row.type || "outro",
    image: null,
    formUrl: null,
  }));
}

function normalizeLegacyEvents(rows: any[]): DashboardEvent[] {
  return (rows || []).map((item, index) => {
    const rawDate =
      item.eventDate ||
      item.startDate ||
      item.event_date ||
      item.createdAt ||
      new Date().toISOString();

    return {
      id: String(item.id || item._id || `${index}-${rawDate}`),
      name: item.name || "Evento",
      description: item.description || "",
      eventDate: rawDate,
      startDate: item.startDate || item.eventDate || item.event_date || rawDate,
      endDate: item.endDate || item.eventDate || item.event_date || rawDate,
      location: item.location || "",
      type: item.type || "outro",
      image: item.image || null,
      formUrl: item.formUrl || null,
    };
  });
}

export const useEvents = () => {
  const [eventos, setEventos] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, description, event_date, location, type, active")
        .eq("active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;

      const mapped = mapSupabaseEvents((data || []) as SupabaseEventRow[]);
      setEventos(mapped);
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(mapped));
    } catch (supabaseError) {
      try {
        const legacy = await getEventById();
        const normalizedLegacy = normalizeLegacyEvents(legacy);
        setEventos(normalizedLegacy);
        await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(normalizedLegacy));
      } catch (legacyError) {
        console.error("Erro ao carregar eventos:", supabaseError, legacyError);
        const cachedEventos = await AsyncStorage.getItem(EVENTS_CACHE_KEY);

        if (cachedEventos) {
          setEventos(JSON.parse(cachedEventos));
        } else {
          setEventos([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { eventos, loading, fetchEvents };
};
