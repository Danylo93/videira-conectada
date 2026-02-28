import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
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

type Dizimista = {
  id: string;
  nome_completo: string;
  conjugue: string | null;
  discipulador_id: string;
  discipulador_name: string;
  telefone: string;
  casado: boolean;
  created_at: string;
};

type Discipulador = {
  id: string;
  name: string;
};

function formatPhoneForStorage(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatPhoneForDisplay(raw: string): string {
  const numbers = raw.replace(/\D/g, "");
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return raw;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}

const DizimistasManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const hasAccess = role === "pastor" || role === "obreiro";
  const canManage = hasAccess;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("all");
  const [civilFilter, setCivilFilter] = useState<"all" | "casado" | "solteiro">("all");

  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [formNome, setFormNome] = useState<string>("");
  const [formCasado, setFormCasado] = useState<boolean>(false);
  const [formConjugue, setFormConjugue] = useState<string>("");
  const [formDiscipuladorId, setFormDiscipuladorId] = useState<string>("");
  const [formTelefone, setFormTelefone] = useState<string>("");

  const loadData = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [discipResult, dizimistasResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name")
          .eq("role", "discipulador")
          .order("name"),
        supabase
          .from("dizimistas")
          .select("id, nome_completo, conjugue, discipulador_id, telefone, casado, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (discipResult.error) throw discipResult.error;
      if (dizimistasResult.error) throw dizimistasResult.error;

      const discipList = (discipResult.data || []) as Discipulador[];
      setDiscipuladores(discipList);

      const discipMap = new Map(discipList.map((item) => [item.id, item.name]));
      const mapped = ((dizimistasResult.data || []) as any[]).map((item) => ({
        ...item,
        discipulador_name: discipMap.get(item.discipulador_id) || "Nao informado",
      })) as Dizimista[];
      setDizimistas(mapped);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar dizimistas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredDizimistas = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return dizimistas.filter((item) => {
      const matchesSearch =
        !query ||
        item.nome_completo.toLowerCase().includes(query) ||
        (item.conjugue || "").toLowerCase().includes(query) ||
        item.discipulador_name.toLowerCase().includes(query) ||
        item.telefone.includes(query);

      const matchesDiscipulador =
        selectedDiscipulador === "all" || item.discipulador_id === selectedDiscipulador;

      const matchesCivil =
        civilFilter === "all" ||
        (civilFilter === "casado" && item.casado) ||
        (civilFilter === "solteiro" && !item.casado);

      return matchesSearch && matchesDiscipulador && matchesCivil;
    });
  }, [dizimistas, searchTerm, selectedDiscipulador, civilFilter]);

  const resetForm = () => {
    setFormNome("");
    setFormCasado(false);
    setFormConjugue("");
    setFormDiscipuladorId("");
    setFormTelefone("");
  };

  const createDizimista = async () => {
    if (!canManage) return;

    if (!formNome.trim()) {
      Alert.alert("Validacao", "Informe o nome completo.");
      return;
    }
    if (!formDiscipuladorId) {
      Alert.alert("Validacao", "Selecione um discipulador.");
      return;
    }
    if (!formTelefone.trim()) {
      Alert.alert("Validacao", "Informe o telefone.");
      return;
    }
    if (formCasado && !formConjugue.trim()) {
      Alert.alert("Validacao", "Informe o nome do conjuge.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("dizimistas").insert({
        nome_completo: formNome.trim(),
        conjugue: formCasado ? formConjugue.trim() : null,
        discipulador_id: formDiscipuladorId,
        telefone: formatPhoneForStorage(formTelefone),
        casado: formCasado,
      });

      if (error) throw error;

      setCreateModalVisible(false);
      Alert.alert("Sucesso", "Dizimista cadastrado.");
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel cadastrar dizimista.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.COLORS.GRAY3} />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.restrictedText}>Dizimistas disponivel para pastor e obreiro.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.COLORS.PURPLEDARK1} size="large" />
          <Text style={styles.loadingText}>Carregando dizimistas...</Text>
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
          <Text style={styles.headerKicker}>DIZIMISTAS</Text>
          <Text style={styles.headerTitle}>Gestao de Dizimistas</Text>
          <Text style={styles.headerSubtitle}>Acompanhe cadastros e discipuladores responsaveis.</Text>
          {canManage && (
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => {
                resetForm();
                setFormDiscipuladorId(discipuladores[0]?.id || "");
                setCreateModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color={theme.COLORS.WHITE} />
              <Text style={styles.newButtonText}>Novo cadastro</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{dizimistas.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Filtrados</Text>
            <Text style={styles.statValue}>{filteredDizimistas.length}</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtros</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchTerm("");
                setSelectedDiscipulador("all");
                setCivilFilter("all");
              }}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.input}
            placeholder="Buscar por nome, discipulador ou telefone"
          />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedDiscipulador} onValueChange={(value) => setSelectedDiscipulador(value as string)}>
              <Picker.Item label="Todos os discipuladores" value="all" />
              {discipuladores.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={civilFilter}
              onValueChange={(value) => setCivilFilter(value as "all" | "casado" | "solteiro")}
            >
              <Picker.Item label="Todos os estados civis" value="all" />
              <Picker.Item label="Casado" value="casado" />
              <Picker.Item label="Solteiro" value="solteiro" />
            </Picker>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Lista ({filteredDizimistas.length})</Text>
          {filteredDizimistas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum dizimista encontrado.</Text>
          ) : (
            filteredDizimistas.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{item.nome_completo}</Text>
                  <Text style={styles.itemMeta}>Discipulador: {item.discipulador_name}</Text>
                  <Text style={styles.itemMeta}>Telefone: {formatPhoneForDisplay(item.telefone)}</Text>
                  <Text style={styles.itemMeta}>Cadastro: {formatDate(item.created_at)}</Text>
                  {item.casado ? (
                    <Text style={styles.itemMeta}>Conjuge: {item.conjugue || "-"}</Text>
                  ) : (
                    <Text style={styles.itemMeta}>Estado civil: Solteiro</Text>
                  )}
                </View>
                <View style={styles.civilBadge}>
                  <Text style={styles.civilBadgeText}>{item.casado ? "Casado" : "Solteiro"}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={createModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo dizimista</Text>
            <Text style={styles.modalSubtitle}>Cadastro rapido interno.</Text>

            <Text style={styles.label}>Nome completo</Text>
            <TextInput value={formNome} onChangeText={setFormNome} style={styles.input} placeholder="Nome completo" />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Casado(a)</Text>
              <Switch value={formCasado} onValueChange={setFormCasado} />
            </View>

            {formCasado && (
              <>
                <Text style={styles.label}>Conjuge</Text>
                <TextInput
                  value={formConjugue}
                  onChangeText={setFormConjugue}
                  style={styles.input}
                  placeholder="Nome do conjuge"
                />
              </>
            )}

            <Text style={styles.label}>Discipulador</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={formDiscipuladorId} onValueChange={(value) => setFormDiscipuladorId(value as string)}>
                <Picker.Item label="Selecione" value="" />
                {discipuladores.map((item) => (
                  <Picker.Item key={item.id} label={item.name} value={item.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              value={formTelefone}
              onChangeText={setFormTelefone}
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="(11) 99999-9999"
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
                onPress={createDizimista}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? "Salvando..." : "Salvar"}</Text>
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
    textAlign: "center",
    color: theme.COLORS.GRAY2,
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
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    color: theme.COLORS.GRAY2,
    fontWeight: "600",
    fontSize: 12,
  },
  statValue: {
    marginTop: 6,
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
    fontSize: 20,
  },
  filterCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTitle: {
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
  itemCard: {
    marginTop: 8,
    backgroundColor: "#F7F4FF",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 14,
  },
  itemMeta: {
    marginTop: 2,
    color: theme.COLORS.GRAY2,
    fontSize: 12,
  },
  civilBadge: {
    backgroundColor: "#ECE4FE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  civilBadgeText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
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
  switchRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    color: theme.COLORS.GRAY1,
    fontWeight: "600",
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

export default DizimistasManagementScreen;
