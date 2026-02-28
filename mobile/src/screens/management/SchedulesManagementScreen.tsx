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

type AreaServico = "midia" | "domingo_kids" | "louvor" | "mesa_som" | "cantina" | "conexao";
type DiaServico = "sabado" | "domingo";
type FuncaoLouvor =
  | "ministro"
  | "violao"
  | "voz1"
  | "voz2"
  | "baixo"
  | "teclado"
  | "bateria"
  | "guitarra";
type FuncaoConexao =
  | "recepcao1"
  | "recepcao2"
  | "estacionamento1"
  | "estacionamento2"
  | "nave_igreja"
  | "porta_kids";

type Servo = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  ativo: boolean;
};

type Escala = {
  id: string;
  semana_inicio: string;
  area: AreaServico;
  servo_id: string;
  servo_name: string | null;
  dia: DiaServico;
  locked: boolean;
  created_by: string;
  funcao_louvor?: FuncaoLouvor | null;
  funcao_conexao?: FuncaoConexao | null;
};

const AREAS: { value: AreaServico; label: string }[] = [
  { value: "midia", label: "Midia" },
  { value: "domingo_kids", label: "Domingo Kids" },
  { value: "louvor", label: "Louvor" },
  { value: "mesa_som", label: "Mesa de Som" },
  { value: "cantina", label: "Cantina" },
  { value: "conexao", label: "Conexao" },
];

const FUNCOES_LOUVOR: { value: FuncaoLouvor; label: string }[] = [
  { value: "ministro", label: "Ministro" },
  { value: "violao", label: "Violao" },
  { value: "voz1", label: "Voz 1" },
  { value: "voz2", label: "Voz 2" },
  { value: "baixo", label: "Baixo" },
  { value: "teclado", label: "Teclado" },
  { value: "bateria", label: "Bateria" },
  { value: "guitarra", label: "Guitarra" },
];

const FUNCOES_CONEXAO: { value: FuncaoConexao; label: string }[] = [
  { value: "recepcao1", label: "Recepcao 1" },
  { value: "recepcao2", label: "Recepcao 2" },
  { value: "estacionamento1", label: "Estacionamento 1" },
  { value: "estacionamento2", label: "Estacionamento 2" },
  { value: "nave_igreja", label: "Nave da igreja" },
  { value: "porta_kids", label: "Porta dos Kids" },
];

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getCurrentSaturday(): string {
  const today = new Date();
  const day = today.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayDiff);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return toIsoDate(saturday);
}

function addDays(isoDate: string, days: number): string {
  const base = new Date(isoDate);
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

const SchedulesManagementScreen = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const canEdit = role === "pastor" || role === "discipulador" || role === "lider";
  const canAccess = canEdit;

  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentSaturday());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [servos, setServos] = useState<Servo[]>([]);

  const [newEscala, setNewEscala] = useState<{
    area: AreaServico;
    dia: DiaServico;
    servo_id: string;
    funcao_louvor: FuncaoLouvor | "";
    funcao_conexao: FuncaoConexao | "";
  }>({
    area: "midia",
    dia: "sabado",
    servo_id: "",
    funcao_louvor: "",
    funcao_conexao: "",
  });

  const [newServoModalVisible, setNewServoModalVisible] = useState<boolean>(false);
  const [newServoName, setNewServoName] = useState<string>("");

  const loadData = async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let servosQuery = supabase
        .from("servos")
        .select("id, nome, telefone, email, ativo")
        .order("nome");

      if (!canEdit) {
        servosQuery = servosQuery.eq("ativo", true);
      }

      const [{ data: servosData, error: servosError }, { data: escalasData, error: escalasError }] =
        await Promise.all([
          servosQuery,
          supabase
            .from("escalas")
            .select(
              "id, semana_inicio, area, servo_id, dia, locked, created_by, funcao_louvor, funcao_conexao",
            )
            .eq("semana_inicio", selectedWeek)
            .order("area", { ascending: true }),
        ]);

      if (servosError) throw servosError;
      if (escalasError) throw escalasError;

      const servoList = (servosData || []) as Servo[];
      setServos(servoList);

      const servoNameMap = new Map<string, string>(servoList.map((s) => [s.id, s.nome]));
      const formatted = ((escalasData || []) as any[]).map((item) => ({
        ...item,
        servo_name: servoNameMap.get(item.servo_id) || null,
      })) as Escala[];

      setEscalas(formatted);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar as escalas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [selectedWeek]);

  const getAvailableServos = (dia: DiaServico): Servo[] => {
    const escalados = new Set(
      escalas.filter((e) => e.dia === dia).map((e) => e.servo_id),
    );
    return servos.filter((servo) => servo.ativo && !escalados.has(servo.id));
  };

  const groupedEscalas = useMemo(() => {
    const base: Record<AreaServico, { sabado: Escala[]; domingo: Escala[] }> = {
      midia: { sabado: [], domingo: [] },
      domingo_kids: { sabado: [], domingo: [] },
      louvor: { sabado: [], domingo: [] },
      mesa_som: { sabado: [], domingo: [] },
      cantina: { sabado: [], domingo: [] },
      conexao: { sabado: [], domingo: [] },
    };

    escalas.forEach((escala) => {
      base[escala.area][escala.dia].push(escala);
    });

    return base;
  }, [escalas]);

  const createEscala = async () => {
    if (!canEdit) return;
    if (!newEscala.servo_id) {
      Alert.alert("Servo obrigatorio", "Selecione um servo.");
      return;
    }
    if (newEscala.area === "louvor" && !newEscala.funcao_louvor) {
      Alert.alert("Funcao obrigatoria", "Selecione a funcao de louvor.");
      return;
    }
    if (newEscala.area === "conexao" && !newEscala.funcao_conexao) {
      Alert.alert("Funcao obrigatoria", "Selecione a funcao de conexao.");
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, any> = {
        semana_inicio: selectedWeek,
        area: newEscala.area,
        servo_id: newEscala.servo_id,
        dia: newEscala.dia,
        created_by: user?.id,
      };

      if (newEscala.area === "louvor") {
        payload.funcao_louvor = newEscala.funcao_louvor;
        payload.funcao_conexao = null;
      } else if (newEscala.area === "conexao") {
        payload.funcao_conexao = newEscala.funcao_conexao;
        payload.funcao_louvor = null;
      } else {
        payload.funcao_louvor = null;
        payload.funcao_conexao = null;
      }

      const { error } = await supabase.from("escalas").insert(payload);
      if (error) throw error;
      Alert.alert("Sucesso", "Servo adicionado na escala.");

      setNewEscala((prev) => ({
        ...prev,
        servo_id: "",
        funcao_louvor: "",
        funcao_conexao: "",
      }));

      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Erro ao adicionar",
        error?.message || "Nao foi possivel adicionar este servo na escala.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEscala = async (escalaId: string) => {
    if (!canEdit) return;
    Alert.alert("Remover escala", "Deseja remover este servo da escala?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("escalas").delete().eq("id", escalaId);
            if (error) throw error;
            Alert.alert("Sucesso", "Escala removida.");
            await loadData();
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Nao foi possivel remover.");
          }
        },
      },
    ]);
  };

  const toggleLock = async (escala: Escala) => {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from("escalas")
        .update({ locked: !escala.locked })
        .eq("id", escala.id);

      if (error) throw error;
      Alert.alert("Sucesso", escala.locked ? "Escala desbloqueada." : "Escala bloqueada.");
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel atualizar bloqueio.");
    }
  };

  const createServo = async () => {
    if (!canEdit) return;
    if (!newServoName.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome do servo.");
      return;
    }

    try {
      const { error } = await supabase.from("servos").insert({
        nome: newServoName.trim(),
        ativo: true,
      });
      if (error) throw error;
      Alert.alert("Sucesso", "Servo cadastrado.");

      setNewServoName("");
      setNewServoModalVisible(false);
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel criar servo.");
    }
  };

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={32} color={theme.COLORS.GRAY3} />
          <Text style={styles.restrictedTitle}>Acesso restrito</Text>
          <Text style={styles.restrictedText}>
            Escalas disponivel para pastor, discipulador e lider.
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
          <Text style={styles.loadingText}>Carregando escalas...</Text>
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
          <Text style={styles.headerKicker}>ESCALAS MINISTERIAIS</Text>
          <Text style={styles.headerTitle}>Semana de {selectedWeek}</Text>
          <Text style={styles.headerSubtitle}>Gerencie equipes por area e dia.</Text>
          <View style={styles.weekActions}>
            <TouchableOpacity
              style={styles.weekButton}
              onPress={() => setSelectedWeek((prev) => addDays(prev, -7))}
            >
              <Ionicons name="chevron-back" size={16} color={theme.COLORS.PURPLEDARK1} />
              <Text style={styles.weekButtonText}>Semana anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.weekButton}
              onPress={() => setSelectedWeek((prev) => addDays(prev, 7))}
            >
              <Text style={styles.weekButtonText}>Semana seguinte</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.COLORS.PURPLEDARK1} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekActions}>
            <TouchableOpacity style={styles.weekButton} onPress={() => setSelectedWeek(getCurrentSaturday())}>
              <Ionicons name="today-outline" size={16} color={theme.COLORS.PURPLEDARK1} />
              <Text style={styles.weekButtonText}>Semana atual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.weekButton}
              onPress={() =>
                setNewEscala({
                  area: "midia",
                  dia: "sabado",
                  servo_id: "",
                  funcao_louvor: "",
                  funcao_conexao: "",
                })
              }
            >
              <Ionicons name="refresh-outline" size={16} color={theme.COLORS.PURPLEDARK1} />
              <Text style={styles.weekButtonText}>Limpar formulario</Text>
            </TouchableOpacity>
          </View>
        </View>

        {canEdit && (
          <View style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <Text style={styles.formTitle}>Adicionar servo na escala</Text>
              <TouchableOpacity style={styles.newServoButton} onPress={() => setNewServoModalVisible(true)}>
                <Ionicons name="person-add-outline" size={15} color={theme.COLORS.WHITE} />
                <Text style={styles.newServoText}>Novo Servo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Area</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={newEscala.area}
                onValueChange={(value) =>
                  setNewEscala((prev) => ({
                    ...prev,
                    area: value as AreaServico,
                    funcao_louvor: "",
                    funcao_conexao: "",
                  }))
                }
              >
                {AREAS.map((area) => (
                  <Picker.Item key={area.value} label={area.label} value={area.value} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Dia</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={newEscala.dia}
                onValueChange={(value) => setNewEscala((prev) => ({ ...prev, dia: value as DiaServico }))}
              >
                <Picker.Item label="Sabado" value="sabado" />
                <Picker.Item label="Domingo" value="domingo" />
              </Picker>
            </View>

            {newEscala.area === "louvor" && (
              <>
                <Text style={styles.label}>Funcao de louvor</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={newEscala.funcao_louvor}
                    onValueChange={(value) =>
                      setNewEscala((prev) => ({ ...prev, funcao_louvor: value as FuncaoLouvor | "" }))
                    }
                  >
                    <Picker.Item label="Selecione" value="" />
                    {FUNCOES_LOUVOR.map((item) => (
                      <Picker.Item key={item.value} label={item.label} value={item.value} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            {newEscala.area === "conexao" && (
              <>
                <Text style={styles.label}>Funcao de conexao</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={newEscala.funcao_conexao}
                    onValueChange={(value) =>
                      setNewEscala((prev) => ({ ...prev, funcao_conexao: value as FuncaoConexao | "" }))
                    }
                  >
                    <Picker.Item label="Selecione" value="" />
                    {FUNCOES_CONEXAO.map((item) => (
                      <Picker.Item key={item.value} label={item.label} value={item.value} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>Servo</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={newEscala.servo_id}
                onValueChange={(value) => setNewEscala((prev) => ({ ...prev, servo_id: value as string }))}
              >
                <Picker.Item label="Selecione" value="" />
                {getAvailableServos(newEscala.dia).map((servo) => (
                  <Picker.Item key={servo.id} label={servo.nome} value={servo.id} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.createEscalaButton} onPress={createEscala} disabled={saving}>
              <Text style={styles.createEscalaText}>{saving ? "Salvando..." : "Adicionar na escala"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {AREAS.map((area) => (
          <View key={area.value} style={styles.areaCard}>
            <Text style={styles.areaTitle}>{area.label}</Text>

            <View style={styles.dayCard}>
              <Text style={styles.dayTitle}>Sabado</Text>
              {groupedEscalas[area.value].sabado.length === 0 ? (
                <Text style={styles.emptyDayText}>Sem servos escalados.</Text>
              ) : (
                groupedEscalas[area.value].sabado.map((escala) => (
                  <View key={escala.id} style={styles.escalaItem}>
                    <View style={styles.escalaInfo}>
                      <Text style={styles.escalaName}>{escala.servo_name || "Servo removido"}</Text>
                      {escala.funcao_louvor ? (
                        <Text style={styles.escalaMeta}>Funcao: {escala.funcao_louvor}</Text>
                      ) : null}
                      {escala.funcao_conexao ? (
                        <Text style={styles.escalaMeta}>Funcao: {escala.funcao_conexao}</Text>
                      ) : null}
                    </View>
                    {canEdit && (
                      <View style={styles.escalaActions}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => toggleLock(escala)}>
                          <Ionicons
                            name={escala.locked ? "lock-closed-outline" : "lock-open-outline"}
                            size={17}
                            color={theme.COLORS.PURPLEDARK1}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButtonDanger} onPress={() => deleteEscala(escala.id)}>
                          <Ionicons name="trash-outline" size={17} color={theme.COLORS.RED} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            <View style={styles.dayCard}>
              <Text style={styles.dayTitle}>Domingo</Text>
              {groupedEscalas[area.value].domingo.length === 0 ? (
                <Text style={styles.emptyDayText}>Sem servos escalados.</Text>
              ) : (
                groupedEscalas[area.value].domingo.map((escala) => (
                  <View key={escala.id} style={styles.escalaItem}>
                    <View style={styles.escalaInfo}>
                      <Text style={styles.escalaName}>{escala.servo_name || "Servo removido"}</Text>
                      {escala.funcao_louvor ? (
                        <Text style={styles.escalaMeta}>Funcao: {escala.funcao_louvor}</Text>
                      ) : null}
                      {escala.funcao_conexao ? (
                        <Text style={styles.escalaMeta}>Funcao: {escala.funcao_conexao}</Text>
                      ) : null}
                    </View>
                    {canEdit && (
                      <View style={styles.escalaActions}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => toggleLock(escala)}>
                          <Ionicons
                            name={escala.locked ? "lock-closed-outline" : "lock-open-outline"}
                            size={17}
                            color={theme.COLORS.PURPLEDARK1}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButtonDanger} onPress={() => deleteEscala(escala.id)}>
                          <Ionicons name="trash-outline" size={17} color={theme.COLORS.RED} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal transparent visible={newServoModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Servo</Text>
            <Text style={styles.modalSubtitle}>Adicione rapidamente para usar nas escalas.</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={newServoName}
              onChangeText={setNewServoName}
              style={styles.input}
              placeholder="Nome completo"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setNewServoModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSaveButton]} onPress={createServo}>
                <Text style={styles.modalSaveText}>Salvar</Text>
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
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 4,
  },
  weekActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  weekButton: {
    flex: 1,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  weekButtonText: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 12,
  },
  formCard: {
    backgroundColor: theme.COLORS.WHITE,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  formTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
    fontSize: 15,
  },
  newServoButton: {
    backgroundColor: theme.COLORS.PURPLEDARK1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newServoText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
    fontSize: 12,
  },
  label: {
    color: theme.COLORS.GRAY2,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#D8D2E8",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAF9FD",
  },
  createEscalaButton: {
    marginTop: 12,
    backgroundColor: "#4C1D95",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  createEscalaText: {
    color: theme.COLORS.WHITE,
    fontWeight: "700",
  },
  areaCard: {
    marginTop: 12,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
  },
  areaTitle: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "800",
    fontSize: 16,
  },
  dayCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E8E3F4",
    borderRadius: 10,
    padding: 10,
  },
  dayTitle: {
    color: theme.COLORS.GRAY1,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyDayText: {
    color: theme.COLORS.GRAY3,
    fontSize: 12,
  },
  escalaItem: {
    backgroundColor: "#F6F3FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  escalaInfo: {
    flex: 1,
  },
  escalaName: {
    color: theme.COLORS.PURPLEDARK1,
    fontWeight: "700",
    fontSize: 13,
  },
  escalaMeta: {
    color: theme.COLORS.GRAY2,
    fontSize: 11,
    marginTop: 2,
  },
  escalaActions: {
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
  input: {
    borderWidth: 1,
    borderColor: "#D8D2E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.COLORS.GRAY1,
    backgroundColor: "#FAF9FD",
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

export default SchedulesManagementScreen;
