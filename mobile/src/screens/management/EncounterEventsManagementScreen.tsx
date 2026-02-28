import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import AuthContext from "../../context/UserContext";
import { supabase } from "../../services/supabase";
import theme from "../../styles/theme";
import { normalizeRole } from "../../utils/role";

type EncounterType = "jovens" | "adultos";

type EncounterEvent = {
  id: string;
  name: string;
  description?: string | null;
  event_dates: string[];
  location: string;
  encounter_type: EncounterType;
  max_capacity?: number | null;
  created_by: string;
  created_at: string;
};

type EventStats = {
  registrations_count: number;
  attended_count: number;
  total_revenue: number;
};

function toDateLabel(isoDate: string): string {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR");
}

function toMoney(value: number): string {
  return `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseEventDates(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
}

const EncounterEventsManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const canManage = role === "pastor" || role === "discipulador";
  const hasAccess = canManage;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [events, setEvents] = useState<EncounterEvent[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, EventStats>>({});
  const [typeFilter, setTypeFilter] = useState<"all" | EncounterType>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    eventDatesInput: string;
    location: string;
    encounterType: EncounterType;
    maxCapacity: string;
  }>({
    name: "",
    description: "",
    eventDatesInput: "",
    location: "",
    encounterType: "jovens",
    maxCapacity: "",
  });

  const loadData = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [eventsResult, registrationsResult] = await Promise.all([
        supabase.from("encounter_events").select("*").order("created_at", { ascending: false }),
        supabase.from("encounter_with_god").select("event_id, attended, amount_paid"),
      ]);

      if (eventsResult.error) throw eventsResult.error;

      const eventRows = (eventsResult.data || []) as any[];
      setEvents(
        eventRows.map((event) => ({
          id: event.id,
          name: event.name,
          description: event.description,
          event_dates: Array.isArray(event.event_dates) ? event.event_dates : [],
          location: event.location,
          encounter_type: event.encounter_type,
          max_capacity: event.max_capacity,
          created_by: event.created_by,
          created_at: event.created_at,
        })) as EncounterEvent[],
      );

      const stats: Record<string, EventStats> = {};
      if (!registrationsResult.error && registrationsResult.data) {
        (registrationsResult.data as any[]).forEach((registration) => {
          const eventId = registration.event_id;
          if (!eventId) return;
          if (!stats[eventId]) {
            stats[eventId] = { registrations_count: 0, attended_count: 0, total_revenue: 0 };
          }
          stats[eventId].registrations_count += 1;
          if (registration.attended) stats[eventId].attended_count += 1;

          const rawAmount = Number(registration.amount_paid || 0);
          if (Number.isFinite(rawAmount)) {
            stats[eventId].total_revenue += rawAmount;
          }
        });
      }

      setStatsMap(stats);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar os eventos de encontro.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesType = typeFilter === "all" || event.encounter_type === typeFilter;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search) ||
        (event.description || "").toLowerCase().includes(search) ||
        event.location.toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  }, [events, typeFilter, searchTerm]);

  const overview = useMemo(() => {
    return filteredEvents.reduce(
      (acc, event) => {
        const stats = statsMap[event.id] || {
          registrations_count: 0,
          attended_count: 0,
          total_revenue: 0,
        };
        acc.events += 1;
        acc.registrations += stats.registrations_count;
        acc.revenue += stats.total_revenue;
        return acc;
      },
      { events: 0, registrations: 0, revenue: 0 },
    );
  }, [filteredEvents, statsMap]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      eventDatesInput: "",
      location: "",
      encounterType: "jovens",
      maxCapacity: "",
    });
  };

  const createEvent = async () => {
    if (!canManage) return;
    const eventDates = parseEventDates(form.eventDatesInput);
    if (!form.name.trim() || !form.location.trim() || eventDates.length === 0) {
      Alert.alert("Campos obrigatorios", "Preencha nome, local e ao menos uma data (YYYY-MM-DD).");
      return;
    }

    const maxCapacityParsed = Number(form.maxCapacity);
    const max_capacity =
      form.maxCapacity.trim() && Number.isFinite(maxCapacityParsed) ? maxCapacityParsed : null;

    try {
      setSaving(true);
      const { error } = await supabase.from("encounter_events").insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        event_dates: eventDates,
        location: form.location.trim(),
        encounter_type: form.encounterType,
        max_capacity,
        created_by: user?.id,
      });

      if (error) throw error;

      setCreateModalVisible(false);
      Alert.alert("Sucesso", "Evento de encontro criado.");
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel criar o evento.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!canManage) return;

    Alert.alert("Excluir evento", "Deseja remover este evento de encontro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("encounter_events").delete().eq("id", eventId);
            if (error) throw error;
            Alert.alert("Sucesso", "Evento removido.");
            await loadData();
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Nao foi possivel excluir o evento.");
          }
        },
      },
    ]);
  };

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.COLORS.GRAY3} />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.restrictedText}>
            Eventos de encontro disponivel para pastor e discipulador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.COLORS.PURPLEDARK1} size="large" />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerKicker}>ENCONTRO COM DEUS</Text>
          <Text style={styles.headerTitle}>Eventos de Encontro</Text>
          <Text style={styles.headerSubtitle}>
            Gerencie datas, inscritos e desempenho dos encontros.
          </Text>

          {canManage && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => {
                resetForm();
                setCreateModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color={theme.COLORS.WHITE} />
              <Text style={styles.newButtonText}>Novo evento</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Eventos</Text>
            <Text style={styles.summaryValue}>{overview.events}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Inscricoes</Text>
            <Text style={styles.summaryValue}>{overview.registrations}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Receita</Text>
            <Text style={styles.summaryValue}>{toMoney(overview.revenue)}</Text>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtros</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setTypeFilter("all");
                setSearchTerm("");
              }}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por nome, descricao ou local"
            style={styles.input}
          />
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={typeFilter}
              onValueChange={(value) => setTypeFilter(value as "all" | EncounterType)}
            >
              <Picker.Item label="Todos os tipos" value="all" />
              <Picker.Item label="Jovens" value="jovens" />
              <Picker.Item label="Adultos" value="adultos" />
            </Picker>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Lista ({filteredEvents.length})</Text>
          {filteredEvents.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
          ) : (
            filteredEvents.map((event) => {
              const stats = statsMap[event.id] || {
                registrations_count: 0,
                attended_count: 0,
                total_revenue: 0,
              };
              const firstDate = event.event_dates[0];
              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventMain}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      <Text style={styles.eventMeta}>
                        Tipo: {event.encounter_type === "jovens" ? "Jovens" : "Adultos"}
                      </Text>
                      <Text style={styles.eventMeta}>Local: {event.location}</Text>
                      <Text style={styles.eventMeta}>
                        Primeira data: {firstDate ? toDateLabel(firstDate) : "-"}
                      </Text>
                    </View>
                    {canManage && (
                      <TouchableOpacity style={styles.iconButtonDanger} onPress={() => deleteEvent(event.id)}>
                        <Ionicons name="trash-outline" size={18} color={theme.COLORS.RED} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricText}>Inscritos: {stats.registrations_count}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricText}>Presentes: {stats.attended_count}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricText}>Receita: {toMoney(stats.total_revenue)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={createModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo evento de encontro</Text>
            <Text style={styles.modalSubtitle}>
              Datas separadas por virgula no formato YYYY-MM-DD.
            </Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
              style={styles.input}
              placeholder="Ex: Encontro Jovens Setembro"
            />

            <Text style={styles.label}>Descricao</Text>
            <TextInput
              value={form.description}
              onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={2}
              placeholder="Descricao do encontro"
            />

            <Text style={styles.label}>Datas</Text>
            <TextInput
              value={form.eventDatesInput}
              onChangeText={(eventDatesInput) => setForm((prev) => ({ ...prev, eventDatesInput }))}
              style={styles.input}
              placeholder="2026-03-20, 2026-03-21, 2026-03-22"
            />

            <Text style={styles.label}>Local</Text>
            <TextInput
              value={form.location}
              onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
              style={styles.input}
              placeholder="Sitio / Igreja"
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.encounterType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, encounterType: value as EncounterType }))
                }
              >
                <Picker.Item label="Jovens" value="jovens" />
                <Picker.Item label="Adultos" value="adultos" />
              </Picker>
            </View>

            <Text style={styles.label}>Capacidade maxima</Text>
            <TextInput
              value={form.maxCapacity}
              onChangeText={(maxCapacity) => setForm((prev) => ({ ...prev, maxCapacity }))}
              style={styles.input}
              keyboardType="numeric"
              placeholder="Ex: 100"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setCreateModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={createEvent}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? "Salvando..." : "Criar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F2F8",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: theme.COLORS.GRAY2,
  },
  restrictedTitle: {
    marginTop: 10,
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
    fontSize: 18,
  },
  restrictedText: {
    marginTop: 6,
    color: theme.COLORS.GRAY2,
    textAlign: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: "#1F1142",
    borderRadius: 16,
    padding: 16,
  },
  headerKicker: {
    color: "#BBA7E8",
    fontWeight: "700",
    fontSize: 12,
  },
  headerTitle: {
    color: theme.COLORS.WHITE,
    fontWeight: "800",
    fontSize: 22,
    marginTop: 4,
  },
  headerSubtitle: {
    color: "#D9CEF2",
    marginTop: 6,
  },
  newButton: {
    marginTop: 10,
    backgroundColor: "#4C1D95",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  newButtonText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 10,
  },
  summaryLabel: {
    color: theme.COLORS.GRAY2,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    marginTop: 6,
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
  },
  filtersCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filtersTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
  },
  clearButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8D2E8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F8F5FF",
  },
  clearButtonText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D8D2E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.COLORS.GRAY1,
    backgroundColor: "#FAF9FD",
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#D8D2E8",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: "#FAF9FD",
  },
  listCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  listTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 10,
    color: theme.COLORS.GRAY2,
  },
  eventCard: {
    marginTop: 8,
    backgroundColor: "#F7F4FF",
    borderRadius: 10,
    padding: 10,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  eventMain: {
    flex: 1,
  },
  eventName: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 14,
  },
  eventMeta: {
    marginTop: 2,
    color: theme.COLORS.GRAY2,
    fontSize: 12,
  },
  metricsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  metricBadge: {
    backgroundColor: "#ECE4FE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metricText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 11,
  },
  iconButtonDanger: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 10, 27, 0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
  },
  modalTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: theme.COLORS.GRAY2,
    marginTop: 4,
  },
  label: {
    color: theme.COLORS.GRAY2,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelButton: {
    backgroundColor: "#F2EFFB",
  },
  modalSaveButton: {
    backgroundColor: theme.COLORS.PURPLEDARK1,
  },
  modalCancelText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
  },
  modalSaveText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
  },
});

export default EncounterEventsManagementScreen;
