import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import EmailInput from "../../components/common/EmailInput";
import PasswordInput from "../../components/common/PasswordInput";
import AuthContext from "../../context/UserContext";
import theme from "../../styles/theme";

const RegisterScreen = ({ navigation }) => {
  const { registerMember } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert("Cadastro", "Preencha nome, e-mail e senha.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Cadastro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Cadastro", "As senhas nao conferem.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerMember({
        name: trimmedName,
        email: trimmedEmail,
        password,
        phone: phone.trim() || undefined,
      });

      if (result.autoLoggedIn) {
        Alert.alert("Cadastro concluido", "Conta criada com sucesso.");
        return;
      }

      if (result.requiresEmailConfirmation) {
        Alert.alert(
          "Cadastro recebido",
          "Verifique seu e-mail para confirmar a conta e depois entre no app."
        );
      } else {
        Alert.alert("Cadastro recebido", "Conta criada. Agora faca login.");
      }

      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert("Cadastro", error?.message || "Nao foi possivel concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Cadastro de Membro</Text>
            <Text style={styles.subtitle}>Acesso exclusivo para membros da Videira.</Text>

            <View style={styles.card}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nome completo"
                style={styles.textInput}
              />

              <EmailInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                style={styles.inputSpacing}
              />

              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Whatsapp (opcional)"
                keyboardType="phone-pad"
                style={styles.textInput}
              />

              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                style={styles.inputSpacing}
              />

              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar senha"
                style={styles.inputSpacing}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                disabled={loading}
                onPress={handleRegister}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Criar conta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>Ja tenho conta</Text>
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#E2E8F0",
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  inputSpacing: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
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
  linkText: {
    marginTop: 14,
    textAlign: "center",
    color: "#BFDBFE",
    fontWeight: "600",
  },
});

export default RegisterScreen;
