import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useForm } from "react-hook-form";
import PasswordInput from "../../components/common/PasswordInput";
import EmailInput from "../../components/common/EmailInput";
import AuthContext from "../../context/UserContext";
import theme from "../../styles/theme";

type LoginFormData = {
  email: string;
  password: string;
};

const LoginScreen = ({ navigation }) => {
  const { watch, setValue, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { loginUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const success = await loginUser(data.email.trim(), data.password);

      if (!success) {
        Alert.alert(
          "Acesso negado",
          "Conta invalida ou sem permissao de membro da Videira."
        );
      }
    } catch (error: any) {
      Alert.alert("Acesso negado", error?.message || "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  };

  const password = watch("password");
  const email = watch("email");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ImageBackground
          source={require("../../../assets/fundo.jpg")}
          style={styles.backgroundImage}
        >
          <View style={styles.overlay} />

          <View style={styles.innerContainer}>
            <View style={styles.headerArea}>
              <Text style={styles.badge}>ACESSO EXCLUSIVO</Text>
              <Text style={styles.title}>Videira Conectada</Text>
              <Text style={styles.subtitle}>
                Entre com sua conta de membro para acessar o app.
              </Text>
            </View>

            <View style={styles.loginCard}>
              <EmailInput
                value={email}
                onChangeText={(text) => setValue("email", text)}
                placeholder="E-mail"
                style={styles.inputSpacing}
              />

              <PasswordInput
                value={password}
                onChangeText={(text) => setValue("password", text)}
                placeholder="Senha"
                style={styles.inputSpacing}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                disabled={loading}
                onPress={handleSubmit(handleLogin)}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLinkText}>Ainda nao tem conta? Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08090A",
  },
  flex: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 9, 10, 0.72)",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
    gap: 28,
  },
  headerArea: {
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: 1,
    color: "#F8FAFC",
    backgroundColor: "rgba(220, 38, 38, 0.86)",
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#E2E8F0",
    maxWidth: 320,
  },
  loginCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  inputSpacing: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.RED,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  registerLink: {
    marginTop: 14,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#BFDBFE",
    fontWeight: "600",
  },
});

export default LoginScreen;
