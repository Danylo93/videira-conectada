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
import { Ionicons } from "@expo/vector-icons";

import AuthContext from "../../context/UserContext";
import { supabase } from "../../services/supabase";
import theme from "../../styles/theme";
import { normalizeRole } from "../../utils/role";

type Sector = "dizimos" | "ofertas" | "cantina";
type Status = "pending" | "approved" | "rejected";

type FinancialReport = {
  id: string;
  week_start: string;
  sector: Sector;
  amount: number;
  date: string;
  total: number;
  status: Status;
  account_status: boolean;
  observations?: string | null;
  created_by: string;
};

type FormState = {
  week_start: string;
  sector: Sector;
  amount: string;
  date: string;
  total: string;
  observations: string;
};

const sectorLabels: Record<Sector, string> = {
  dizimos: "Dizimos",
  ofertas: "Ofertas",
  cantina: "Cantina",
};

const sectorOptions: Sector[] = ["dizimos", "ofertas", "cantina"];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function toMoney(value: number): string {
  return `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const FinancialManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const canManage = role === "pastor" || role === "obreiro";
  const hasAccess = canManage;

  const todayIso = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector>("dizimos");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<FinancialReport | null>(null);
  const [form, setForm] = useState<FormState>({
    week_start: getWeekStart(new Date()),
    sector: "dizimos",
    amount: "",
    date: todayIso,
    total: "",
    observations: "",
  });

  const loadReports = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("financial_reports")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setReports((data || []) as FinancialReport[]);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar o financeiro.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => r.sector === selectedSector);
  }, [reports, selectedSector]);

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, item) => {
        acc[item.sector] += Number(item.total || 0);
        return acc;
      },
      { dizimos: 0, ofertas: 0, cantina: 0 } as Record<Sector, number>,
    );
  }, [reports]);

  const resetForm = () => {
    const now = new Date();
    setForm({
      week_start: getWeekStart(now),
      sector: "dizimos",
      amount: "",
      date: now.toISOString().split("T")[0],
      total: "",
      observations: "",
    });
  };

  const openCreate = () => {
    setEditingReport(null);
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (report: FinancialReport) => {
    setEditingReport(report);
    setForm({
      week_start: report.week_start,
      sector: report.sector,
      amount: String(report.amount ?? ""),
      date: report.date,
      total: String(report.total ?? ""),
      observations: report.observations || "",
    });
    setModalVisible(true);
  };

  const parseNumber = (value: string): number => {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const saveReport = async () => {
    if (!canManage) return;

    const amount = parseNumber(form.amount);
    const total = parseNumber(form.total);

    if (!form.date || Number.isNaN(amount) || Number.isNaN(total)) {
      Alert.alert("Campos invalidos", "Preencha data, valor arrecadado e total.");
      return;
    }

    try {
      setSaving(true);

      if (editingReport) {
        const { error } = await supabase
          .from("financial_reports")
          .update({
            week_start: form.week_start,
            sector: form.sector,
            amount,
            date: form.date,
            total,
            observations: form.observations || null,
          })
          .eq("id", editingReport.id);

        if (error) throw error;
        Alert.alert("Sucesso", "Relatorio financeiro atualizado.");
      } else {
        const { error } = await supabase.from("financial_reports").insert({
          week_start: form.week_start,
          sector: form.sector,
          amount,
          date: form.date,
          total,
          account_status: false,
          observations: form.observations || null,
          created_by: user?.userId || user?.id,
        });

        if (error) throw error;
        Alert.alert("Sucesso", "Relatorio financeiro criado.");
      }

      setModalVisible(false);
      setEditingReport(null);
      await loadReports();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel salvar o relatorio.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccountStatus = async (report: FinancialReport) => {
    if (!canManage) return;
    try {
      const { error } = await supabase
        .from("financial_reports")
        .update({ account_status: !report.account_status })
        .eq("id", report.id);

      if (error) throw error;
      Alert.alert("Sucesso", "Status de prestacao de contas atualizado.");
      await loadReports();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel atualizar o status.");
    }
  };

  const confirmDelete = (reportId: string) => {
    if (!canManage) return;
    Alert.alert("Excluir relatorio", "Deseja remover este relatorio financeiro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("financial_reports").delete().eq("id", reportId);
            if (error) throw error;
            Alert.alert("Sucesso", "Relatorio removido.");
            await loadReports();
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Nao foi possivel excluir.");
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
            Financeiro disponivel apenas para pastor e obreiro.
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
          <Text style={styles.loadingText}>Carregando financeiro...</Text>
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
              loadReports();
            }}
          />
        }
      >
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerKicker}>GESTAO FINANCEIRA</Text>
            <Text style={styles.headerTitle}>Relatorios Semanais</Text>
            <Text style={styles.headerSubtitle}>Controle de dizimos, ofertas e cantina.</Text>
          </View>
          {canManage && (
            <TouchableOpacity style={styles.newButton} onPress={openCreate}>
              <Ionicons name="add" size={18} color={theme.COLORS.WHITE} />
              <Text style={styles.newButtonText}>Novo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryRow}>
          {sectorOptions.map((sector) => (
            <View key={sector} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{sectorLabels[sector]}</Text>
              <Text style={styles.summaryValue}>{toMoney(totals[sector])}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => setSelectedSector("dizimos")}>
            <Ionicons name="funnel-outline" size={14} color={theme.COLORS.PURPLEDARK1} />
            <Text style={styles.secondaryActionText}>Resetar filtro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              setRefreshing(true);
              loadReports();
            }}
          >
            <Ionicons name="refresh-outline" size={14} color={theme.COLORS.PURPLEDARK1} />
            <Text style={styles.secondaryActionText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentRow}>
          {sectorOptions.map((sector) => {
            const active = selectedSector === sector;
            return (
              <TouchableOpacity
                key={sector}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                onPress={() => setSelectedSector(sector)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {sectorLabels[sector]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredReports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum relatorio encontrado para este setor.</Text>
            {canManage && (
              <TouchableOpacity style={styles.emptyActionButton} onPress={openCreate}>
                <Text style={styles.emptyActionText}>Criar relatorio</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredReports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportTopRow}>
                <View>
                  <Text style={styles.reportDate}>{report.date}</Text>
                  <Text style={styles.reportWeek}>Semana de {report.week_start}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{report.status}</Text>
                </View>
              </View>

              <View style={styles.reportValues}>
                <Text style={styles.reportValueText}>Arrecadado: {toMoney(report.amount)}</Text>
                <Text style={styles.reportTotalText}>Total: {toMoney(report.total)}</Text>
              </View>

              {report.observations ? (
                <Text style={styles.observationsText}>Obs: {report.observations}</Text>
              ) : null}

              <View style={styles.reportActions}>
                <View style={styles.accountStatusWrap}>
                  <Text style={styles.accountStatusText}>
                    Prestacao de contas: {report.account_status ? "OK" : "Pendente"}
                  </Text>
                  <Switch
                    value={report.account_status}
                    onValueChange={() => toggleAccountStatus(report)}
                    disabled={!canManage}
                  />
                </View>

                {canManage && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(report)}>
                      <Ionicons name="create-outline" size={18} color={theme.COLORS.PURPLEDARK1} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.iconButtonDanger]}
                      onPress={() => confirmDelete(report.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.COLORS.RED} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingReport ? "Editar relatorio" : "Novo relatorio financeiro"}
            </Text>

            <Text style={styles.label}>Setor</Text>
            <View style={styles.segmentRow}>
              {sectorOptions.map((sector) => {
                const active = form.sector === sector;
                return (
                  <TouchableOpacity
                    key={sector}
                    style={[styles.segmentButton, active && styles.segmentButtonActive]}
                    onPress={() => setForm((prev) => ({ ...prev, sector }))}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {sectorLabels[sector]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Data</Text>
            <TextInput
              value={form.date}
              onChangeText={(date) =>
                setForm((prev) => ({ ...prev, date, week_start: getWeekStart(new Date(date || todayIso)) }))
              }
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />

            <Text style={styles.label}>Valor arrecadado</Text>
            <TextInput
              value={form.amount}
              onChangeText={(amount) => setForm((prev) => ({ ...prev, amount }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.input}
            />

            <Text style={styles.label}>Total</Text>
            <TextInput
              value={form.total}
              onChangeText={(total) => setForm((prev) => ({ ...prev, total }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.input}
            />

            <Text style={styles.label}>Observacoes</Text>
            <TextInput
              value={form.observations}
              onChangeText={(observations) => setForm((prev) => ({ ...prev, observations }))}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.inputMultiline]}
              placeholder="Anotacoes opcionais"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveReport}
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
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 10,
    color: theme.COLORS.GRAY2,
  },
  restrictedTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.PURPLEDARK1,
  },
  restrictedText: {
    marginTop: 8,
    textAlign: "center",
    color: theme.COLORS.GRAY2,
  },
  headerCard: {
    backgroundColor: "#1F1142",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerKicker: {
    color: "#BAA2EB",
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    color: theme.COLORS.WHITE,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  headerSubtitle: {
    color: "#D8CEF4",
    marginTop: 6,
  },
  newButton: {
    backgroundColor: "#4C1D95",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
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
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#F0ECFC",
    borderWidth: 1,
    borderColor: "#DDD4F3",
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  secondaryActionText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
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
    fontWeight: "700",
    fontSize: 14,
  },
  segmentRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  segmentButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6CCE9",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.COLORS.WHITE,
  },
  segmentButtonActive: {
    backgroundColor: theme.COLORS.PURPLEDARK1,
    borderColor: theme.COLORS.PURPLEDARK1,
  },
  segmentText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
  },
  segmentTextActive: {
    color: theme.COLORS.WHITE,
  },
  emptyCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: theme.COLORS.GRAY2,
  },
  emptyActionButton: {
    marginTop: 10,
    backgroundColor: theme.COLORS.PURPLEDARK1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyActionText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
    fontSize: 12,
  },
  reportCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  reportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportDate: {
    color: theme.COLORS.PURPLEDARK1,
    fontSize: 14,
    fontWeight: "700",
  },
  reportWeek: {
    color: theme.COLORS.GRAY2,
    marginTop: 2,
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: "#EEE8FB",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    color: theme.COLORS.PURPLEDARK1,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  reportValues: {
    marginTop: 10,
    gap: 4,
  },
  reportValueText: {
    color: theme.COLORS.GRAY2,
  },
  reportTotalText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
  },
  observationsText: {
    marginTop: 8,
    color: theme.COLORS.GRAY2,
    fontSize: 12,
  },
  reportActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  accountStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  accountStatusText: {
    fontSize: 12,
    color: theme.COLORS.GRAY2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDanger: {
    backgroundColor: "#FFF1F2",
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
  label: {
    color: theme.COLORS.GRAY2,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8D2E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.COLORS.GRAY1,
    backgroundColor: "#FAF9FD",
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
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

export default FinancialManagementScreen;
