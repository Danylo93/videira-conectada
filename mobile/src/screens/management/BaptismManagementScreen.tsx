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

type Batizante = {
  id: string;
  nome_completo: string;
  lider_id: string;
  lider_name: string;
  tamanho_camiseta: string;
  created_at: string;
};

type Leader = {
  id: string;
  name: string;
};

type SheetsConfig = {
  id: string;
  sheet_id: string;
  sheet_name: string;
  enabled: boolean;
};

function formatDate(iso: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}

const BaptismManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const hasAccess =
    role === "pastor" || role === "obreiro" || role === "discipulador" || role === "lider";
  const canManageConfig = role === "pastor" || role === "obreiro";

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [batizantes, setBatizantes] = useState<Batizante[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLeader, setSelectedLeader] = useState<string>("all");

  const [configModalVisible, setConfigModalVisible] = useState<boolean>(false);
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig | null>(null);
  const [sheetIdInput, setSheetIdInput] = useState<string>("");
  const [sheetNameInput, setSheetNameInput] = useState<string>("Batizantes");
  const [sheetEnabledInput, setSheetEnabledInput] = useState<boolean>(true);

  const loadData = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [leadersResult, batizantesResult, configResult] = await Promise.all([
        supabase.from("profiles").select("id, name").eq("role", "lider").order("name"),
        supabase
          .from("batismo_registrations")
          .select("id, nome_completo, lider_id, tamanho_camiseta, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("google_sheets_config").select("*").maybeSingle(),
      ]);

      if (leadersResult.error) throw leadersResult.error;
      if (batizantesResult.error) throw batizantesResult.error;
      if (configResult.error) throw configResult.error;

      const leaderList = (leadersResult.data || []) as Leader[];
      setLeaders(leaderList);

      const leadersMap = new Map(leaderList.map((leader) => [leader.id, leader.name]));
      const mappedBatizantes = ((batizantesResult.data || []) as any[]).map((item) => ({
        ...item,
        lider_name: leadersMap.get(item.lider_id) || "Nao informado",
      })) as Batizante[];
      setBatizantes(mappedBatizantes);

      const config = (configResult.data || null) as SheetsConfig | null;
      setSheetsConfig(config);
      setSheetIdInput(config?.sheet_id || "");
      setSheetNameInput(config?.sheet_name || "Batizantes");
      setSheetEnabledInput(config?.enabled ?? true);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar os batizantes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredBatizantes = useMemo(() => {
    return batizantes.filter((item) => {
      const matchesLeader = selectedLeader === "all" || item.lider_id === selectedLeader;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        item.nome_completo.toLowerCase().includes(normalizedSearch) ||
        item.lider_name.toLowerCase().includes(normalizedSearch) ||
        item.tamanho_camiseta.toLowerCase().includes(normalizedSearch);
      return matchesLeader && matchesSearch;
    });
  }, [batizantes, searchTerm, selectedLeader]);

  const stats = useMemo(() => {
    const bySize = filteredBatizantes.reduce((acc, item) => {
      const key = item.tamanho_camiseta || "-";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: batizantes.length,
      filtered: filteredBatizantes.length,
      bySize,
    };
  }, [batizantes, filteredBatizantes]);

  const saveSheetsConfig = async () => {
    if (!canManageConfig) return;
    if (!sheetIdInput.trim()) {
      Alert.alert("Configuracao", "Informe o ID da planilha.");
      return;
    }

    try {
      setSavingConfig(true);
      let parsedSheetId = sheetIdInput.trim();
      if (parsedSheetId.includes("spreadsheets/d/")) {
        const match = parsedSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match?.[1]) {
          parsedSheetId = match[1];
        }
      }

      if (sheetsConfig?.id) {
        const { error } = await supabase
          .from("google_sheets_config")
          .update({
            sheet_id: parsedSheetId,
            sheet_name: sheetNameInput.trim() || "Batizantes",
            enabled: sheetEnabledInput,
          })
          .eq("id", sheetsConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("google_sheets_config").insert({
          sheet_id: parsedSheetId,
          sheet_name: sheetNameInput.trim() || "Batizantes",
          enabled: sheetEnabledInput,
        });

        if (error) throw error;
      }

      setConfigModalVisible(false);
      Alert.alert("Sucesso", "Configuracao de planilha salva.");
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel salvar a configuracao.");
    } finally {
      setSavingConfig(false);
    }
  };

  const syncGoogleSheets = async () => {
    if (!sheetsConfig?.enabled) {
      Alert.alert("Sincronizacao", "A sincronizacao com Google Sheets esta desabilitada.");
      return;
    }

    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke("sync-batizantes-google-sheets", {
        body: {},
      });

      if (error) throw error;
      Alert.alert("Sincronizacao concluida", data?.message || "Dados sincronizados com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao sincronizar com Google Sheets.");
    } finally {
      setSyncing(false);
    }
  };

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.COLORS.GRAY3} />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.restrictedText}>
            Batismo disponivel para pastor, obreiro, discipulador e lider.
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
          <Text style={styles.loadingText}>Carregando batizantes...</Text>
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
          <Text style={styles.headerKicker}>BATISMO</Text>
          <Text style={styles.headerTitle}>Acompanhamento de Batizantes</Text>
          <Text style={styles.headerSubtitle}>
            Centralize os inscritos e acompanhe tamanhos de camiseta.
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.syncButton} onPress={syncGoogleSheets} disabled={syncing}>
              <Ionicons name="cloud-upload-outline" size={16} color={theme.COLORS.WHITE} />
              <Text style={styles.syncButtonText}>{syncing ? "Sincronizando..." : "Sincronizar"}</Text>
            </TouchableOpacity>
            {canManageConfig && (
              <TouchableOpacity style={styles.configButton} onPress={() => setConfigModalVisible(true)}>
                <Ionicons name="settings-outline" size={16} color={theme.COLORS.PURPLEDARK1} />
                <Text style={styles.configButtonText}>Configurar</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerConfigStatus}>
            Google Sheets: {sheetsConfig?.enabled ? "Ativo" : "Inativo"}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Filtrados</Text>
            <Text style={styles.statValue}>{stats.filtered}</Text>
          </View>
        </View>

        <View style={styles.sizeCard}>
          <Text style={styles.sizeTitle}>Por tamanho</Text>
          <View style={styles.sizeRow}>
            {Object.entries(stats.bySize).length === 0 ? (
              <Text style={styles.sizeEmpty}>Sem dados.</Text>
            ) : (
              Object.entries(stats.bySize).map(([size, qty]) => (
                <View key={size} style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>{size}: {qty}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtros</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchTerm("");
                setSelectedLeader("all");
              }}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por nome, lider ou tamanho"
            style={styles.input}
          />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedLeader} onValueChange={(value) => setSelectedLeader(value as string)}>
              <Picker.Item label="Todos os lideres" value="all" />
              {leaders.map((leader) => (
                <Picker.Item key={leader.id} label={leader.name} value={leader.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Lista ({filteredBatizantes.length})</Text>
          {filteredBatizantes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum batizante encontrado com os filtros atuais.</Text>
          ) : (
            filteredBatizantes.map((item) => (
              <View key={item.id} style={styles.batizanteItem}>
                <View style={styles.batizanteMain}>
                  <Text style={styles.batizanteName}>{item.nome_completo}</Text>
                  <Text style={styles.batizanteMeta}>Lider: {item.lider_name}</Text>
                  <Text style={styles.batizanteMeta}>Data: {formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.shirtBadge}>
                  <Text style={styles.shirtBadgeText}>{item.tamanho_camiseta}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={configModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configurar Google Sheets</Text>
            <Text style={styles.modalSubtitle}>Defina a planilha usada na sincronizacao automatica.</Text>

            <Text style={styles.label}>ID da planilha</Text>
            <TextInput
              value={sheetIdInput}
              onChangeText={setSheetIdInput}
              style={styles.input}
              placeholder="Cole URL ou ID da planilha"
            />

            <Text style={styles.label}>Nome da aba</Text>
            <TextInput
              value={sheetNameInput}
              onChangeText={setSheetNameInput}
              style={styles.input}
              placeholder="Batizantes"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Habilitar sincronizacao</Text>
              <Switch value={sheetEnabledInput} onValueChange={setSheetEnabledInput} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfigModalVisible(false)}
                disabled={savingConfig}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveSheetsConfig}
                disabled={savingConfig}
              >
                <Text style={styles.modalSaveText}>{savingConfig ? "Salvando..." : "Salvar"}</Text>
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
    fontSize: 21,
    marginTop: 4,
  },
  headerSubtitle: {
    color: "#D9CEF2",
    marginTop: 6,
  },
  headerActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  headerConfigStatus: {
    marginTop: 8,
    color: "#D9CEF2",
    fontSize: 12,
    fontWeight: "600",
  },
  syncButton: {
    flex: 1,
    backgroundColor: "#4C1D95",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  syncButtonText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
    fontSize: 12,
  },
  configButton: {
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  configButtonText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
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
  sizeCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  sizeTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
  },
  sizeRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  sizeEmpty: {
    color: theme.COLORS.GRAY2,
    fontSize: 12,
  },
  sizeBadge: {
    backgroundColor: "#EEE8FB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sizeBadgeText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
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
  batizanteItem: {
    marginTop: 8,
    backgroundColor: "#F7F4FF",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  batizanteMain: {
    flex: 1,
  },
  batizanteName: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 14,
  },
  batizanteMeta: {
    marginTop: 2,
    color: theme.COLORS.GRAY2,
    fontSize: 12,
  },
  shirtBadge: {
    backgroundColor: "#EDE4FF",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  shirtBadgeText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
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

export default BaptismManagementScreen;
