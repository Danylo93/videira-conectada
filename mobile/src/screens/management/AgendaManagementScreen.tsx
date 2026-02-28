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

type EventType = "conferencia" | "retiro" | "workshop" | "culto" | "outro";

type ChurchEvent = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  type: EventType;
  max_capacity: number | null;
  active: boolean;
  created_by: string;
  created_at: string;
};

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "conferencia", label: "Conferencia" },
  { value: "retiro", label: "Retiro" },
  { value: "workshop", label: "Workshop" },
  { value: "culto", label: "Culto" },
  { value: "outro", label: "Outro" },
];

function formatDateForInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateForDisplay(value: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatDateForDatabase(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0)).toISOString();
}

function getEventStatus(eventDate: string): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const event = new Date(eventDate);

  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const eventUTC = new Date(Date.UTC(event.getUTCFullYear(), event.getUTCMonth(), event.getUTCDate()));

  if (eventUTC < nowUTC) return "completed";
  if (eventUTC.getTime() === nowUTC.getTime()) return "ongoing";
  return "upcoming";
}

const AgendaManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);

  const canAccess =
    role === "pastor" || role === "obreiro" || role === "discipulador" || role === "lider";
  const canManage = role === "pastor" || role === "obreiro";

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | EventType>("all");

  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    event_date: string;
    location: string;
    type: EventType;
    max_capacity: string;
  }>({
    name: "",
    description: "",
    event_date: "",
    location: "",
    type: "culto",
    max_capacity: "",
  });

  const loadData = async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [eventsResult, registrationsResult] = await Promise.all([
        supabase.from("events").select("*").eq("active", true).order("event_date", { ascending: true }),
        supabase.from("event_registrations").select("event_id"),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (registrationsResult.error) throw registrationsResult.error;

      setEvents((eventsResult.data || []) as ChurchEvent[]);

      const counts: Record<string, number> = {};
      (registrationsResult.data || []).forEach((item: any) => {
        counts[item.event_id] = (counts[item.event_id] || 0) + 1;
      });
      setEventCounts(counts);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar agenda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      const matchesSearch =
        !query ||
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [events, searchTerm, typeFilter]);

  const summary = useMemo(() => {
    return filteredEvents.reduce(
      (acc, event) => {
        const status = getEventStatus(event.event_date);
        acc.total += 1;
        acc.registrations += eventCounts[event.id] || 0;
        if (status === "upcoming") acc.upcoming += 1;
        if (status === "ongoing") acc.ongoing += 1;
        if (status === "completed") acc.completed += 1;
        return acc;
      },
      { total: 0, registrations: 0, upcoming: 0, ongoing: 0, completed: 0 },
    );
  }, [filteredEvents, eventCounts]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      event_date: "",
      location: "",
      type: "culto",
      max_capacity: "",
    });
  };

  const openEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description,
      event_date: formatDateForInput(event.event_date),
      location: event.location,
      type: event.type,
      max_capacity: event.max_capacity ? String(event.max_capacity) : "",
    });
    setEditModalVisible(true);
  };

  const createEvent = async () => {
    if (!canManage) return;
    if (!form.name.trim() || !form.event_date || !form.location.trim()) {
      Alert.alert("Validacao", "Preencha nome, data e local.");
      return;
    }

    const maxCapacityParsed = Number(form.max_capacity);
    const max_capacity =
      form.max_capacity.trim() && Number.isFinite(maxCapacityParsed) ? maxCapacityParsed : null;

    try {
      setSaving(true);
      const { error } = await supabase.from("events").insert({
        name: form.name.trim(),
        description: form.description.trim(),
        event_date: formatDateForDatabase(form.event_date),
        location: form.location.trim(),
        type: form.type,
        max_capacity,
        created_by: user?.id,
        active: true,
      });
      if (error) throw error;

      setCreateModalVisible(false);
      Alert.alert("Sucesso", "Evento criado.");
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel criar evento.");
    } finally {
      setSaving(false);
    }
  };

  const updateEvent = async () => {
    if (!canManage || !editingEvent) return;
    if (!form.name.trim() || !form.event_date || !form.location.trim()) {
      Alert.alert("Validacao", "Preencha nome, data e local.");
      return;
    }

    const maxCapacityParsed = Number(form.max_capacity);
    const max_capacity =
      form.max_capacity.trim() && Number.isFinite(maxCapacityParsed) ? maxCapacityParsed : null;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({
          name: form.name.trim(),
          description: form.description.trim(),
          event_date: formatDateForDatabase(form.event_date),
          location: form.location.trim(),
          type: form.type,
          max_capacity,
        })
        .eq("id", editingEvent.id);

      if (error) throw error;

      setEditModalVisible(false);
      setEditingEvent(null);
      Alert.alert("Sucesso", "Evento atualizado.");
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel atualizar evento.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = (eventId: string) => {
    if (!canManage) return;
    Alert.alert("Remover evento", "Deseja desativar este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("events")
              .update({ active: false })
              .eq("id", eventId);
            if (error) throw error;
            Alert.alert("Sucesso", "Evento removido da agenda mobile.");
            await loadData();
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Nao foi possivel remover evento.");
          }
        },
      },
    ]);
  };

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.COLORS.GRAY3} />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.restrictedText}>Agenda disponivel apenas para membros autorizados.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.COLORS.PURPLEDARK1} size="large" />
          <Text style={styles.loadingText}>Carregando agenda...</Text>
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
          <Text style={styles.headerKicker}>AGENDA</Text>
          <Text style={styles.headerTitle}>Eventos da Igreja</Text>
          <Text style={styles.headerSubtitle}>Visualize e gerencie os eventos ativos.</Text>
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
            <Text style={styles.summaryValue}>{summary.total}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Inscricoes</Text>
            <Text style={styles.summaryValue}>{summary.registrations}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Proximos</Text>
            <Text style={styles.summaryValue}>{summary.upcoming}</Text>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtros</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por nome, local ou descricao"
            style={styles.input}
          />
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={typeFilter}
              onValueChange={(value) => setTypeFilter(value as "all" | EventType)}
            >
              <Picker.Item label="Todos os tipos" value="all" />
              {EVENT_TYPES.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Lista ({filteredEvents.length})</Text>
          {filteredEvents.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
          ) : (
            filteredEvents.map((event) => {
              const status = getEventStatus(event.event_date);
              const statusLabel =
                status === "upcoming" ? "Proximo" : status === "ongoing" ? "Hoje" : "Finalizado";
              const registrations = eventCounts[event.id] || 0;
              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventMain}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      <Text style={styles.eventMeta}>Data: {formatDateForDisplay(event.event_date)}</Text>
                      <Text style={styles.eventMeta}>Local: {event.location}</Text>
                      <Text style={styles.eventMeta}>Tipo: {EVENT_TYPES.find((t) => t.value === event.type)?.label}</Text>
                      <Text style={styles.eventMeta}>
                        Capacidade: {event.max_capacity ? event.max_capacity : "Sem limite"}
                      </Text>
                      <Text style={styles.eventMeta}>Inscritos: {registrations}</Text>
                    </View>
                    <View style={styles.eventRight}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                      </View>
                      {canManage && (
                        <View style={styles.eventActions}>
                          <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(event)}>
                            <Ionicons name="create-outline" size={18} color={theme.COLORS.PURPLEDARK1} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButtonDanger}
                            onPress={() => deleteEvent(event.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color={theme.COLORS.RED} />
                          </TouchableOpacity>
                        </View>
                      )}
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
            <Text style={styles.modalTitle}>Novo evento</Text>
            <Text style={styles.modalSubtitle}>Preencha os dados principais do evento.</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
              style={styles.input}
              placeholder="Nome do evento"
            />

            <Text style={styles.label}>Descricao</Text>
            <TextInput
              value={form.description}
              onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={2}
              placeholder="Descricao"
            />

            <Text style={styles.label}>Data</Text>
            <TextInput
              value={form.event_date}
              onChangeText={(event_date) => setForm((prev) => ({ ...prev, event_date }))}
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Local</Text>
            <TextInput
              value={form.location}
              onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
              style={styles.input}
              placeholder="Local"
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as EventType }))}
              >
                {EVENT_TYPES.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Capacidade maxima</Text>
            <TextInput
              value={form.max_capacity}
              onChangeText={(max_capacity) => setForm((prev) => ({ ...prev, max_capacity }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Opcional"
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
                <Text style={styles.modalSaveText}>{saving ? "Salvando..." : "Salvar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar evento</Text>
            <Text style={styles.modalSubtitle}>Atualize os dados deste evento.</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
              style={styles.input}
              placeholder="Nome do evento"
            />

            <Text style={styles.label}>Descricao</Text>
            <TextInput
              value={form.description}
              onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={2}
              placeholder="Descricao"
            />

            <Text style={styles.label}>Data</Text>
            <TextInput
              value={form.event_date}
              onChangeText={(event_date) => setForm((prev) => ({ ...prev, event_date }))}
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Local</Text>
            <TextInput
              value={form.location}
              onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
              style={styles.input}
              placeholder="Local"
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as EventType }))}
              >
                {EVENT_TYPES.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Capacidade maxima</Text>
            <TextInput
              value={form.max_capacity}
              onChangeText={(max_capacity) => setForm((prev) => ({ ...prev, max_capacity }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Opcional"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={updateEvent}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? "Salvando..." : "Atualizar"}</Text>
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
  eventRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "#ECE4FE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 11,
  },
  eventActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#ECE7FA",
    alignItems: "center",
    justifyContent: "center",
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

export default AgendaManagementScreen;
