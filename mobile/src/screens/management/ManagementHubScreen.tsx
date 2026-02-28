import React, { useContext, useMemo } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AuthContext from "../../context/UserContext";
import {
  MANAGEMENT_MODULES,
  QUICK_ACTIONS,
  ManagementModule,
} from "../../config/managementModules";
import theme from "../../styles/theme";
import { normalizeRole, roleLabel } from "../../utils/role";

const ManagementHubScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);

  const modules = useMemo(() => {
    if (!role) return [];
    return MANAGEMENT_MODULES.filter((item) => item.roles.includes(role));
  }, [role]);

  const readyModules = useMemo(() => modules.filter((item) => !!item.routeName), [modules]);
  const migratingModules = useMemo(() => modules.filter((item) => !item.routeName), [modules]);

  const quickActions = useMemo(() => {
    if (!role) return [];
    return QUICK_ACTIONS[role] || [];
  }, [role]);

  const openModule = (module: ManagementModule) => {
    if (!module.routeName) {
      Alert.alert(
        "Em migracao",
        `${module.title} ainda esta no web. Use a versao web ate a migracao finalizar.`
      );
      return;
    }

    navigation.navigate(module.routeName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>CENTRAL DE GESTAO</Text>
          <Text style={styles.title}>Videira Conectada</Text>
          <Text style={styles.subtitle}>
            Fluxo mobile alinhado com o sistema web para {roleLabel(user?.role)}.
          </Text>
        </View>

        {quickActions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Acoes rapidas</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => openModule(action)}
                  style={styles.quickCard}
                >
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={theme.COLORS.WHITE}
                  />
                  <Text style={styles.quickCardTitle}>{action.title}</Text>
                  <Text style={styles.quickCardDesc}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Modulos prontos no mobile</Text>
        <View style={styles.moduleList}>
          {readyModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              onPress={() => openModule(module)}
              style={styles.moduleCard}
            >
              <View style={styles.moduleIconWrap}>
                <Ionicons
                  name={module.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={theme.COLORS.PURPLEDARK1}
                />
              </View>
              <View style={styles.moduleTextWrap}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </View>
              <View style={styles.moduleStatusWrap}>
                <Text
                  style={[
                    styles.moduleStatusText,
                    module.routeName ? styles.moduleReadyText : styles.moduleMigratingText,
                  ]}
                >
                  {module.routeName ? "Pronto" : "Migracao"}
                </Text>
                <Ionicons
                  name={module.routeName ? "chevron-forward" : "time-outline"}
                  size={18}
                  color={theme.COLORS.GRAY3}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {migratingModules.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Em migracao (ainda no web)</Text>
            <View style={styles.moduleList}>
              {migratingModules.map((module) => (
                <TouchableOpacity
                  key={module.id}
                  onPress={() => openModule(module)}
                  style={styles.moduleCard}
                >
                  <View style={styles.moduleIconWrap}>
                    <Ionicons
                      name={module.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={theme.COLORS.PURPLEDARK1}
                    />
                  </View>
                  <View style={styles.moduleTextWrap}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleDescription}>{module.description}</Text>
                  </View>
                  <View style={styles.moduleStatusWrap}>
                    <Text style={[styles.moduleStatusText, styles.moduleMigratingText]}>
                      Migracao
                    </Text>
                    <Ionicons name="time-outline" size={18} color={theme.COLORS.GRAY3} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  header: {
    backgroundColor: "#1F1142",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  kicker: {
    color: "#C4B5FD",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  subtitle: {
    color: "#D6CCF8",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  sectionTitle: {
    color: "#1F1142",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#4C1D95",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  quickCardTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 8,
  },
  quickCardDesc: {
    color: "#D1C4FF",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  moduleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F2ECFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  moduleTextWrap: {
    flex: 1,
  },
  moduleStatusWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  moduleTitle: {
    color: "#1F1142",
    fontWeight: "700",
    fontSize: 15,
  },
  moduleDescription: {
    color: "#6B7280",
    marginTop: 2,
    fontSize: 12,
  },
  moduleStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  moduleReadyText: {
    color: "#166534",
  },
  moduleMigratingText: {
    color: "#B45309",
  },
});

export default ManagementHubScreen;
