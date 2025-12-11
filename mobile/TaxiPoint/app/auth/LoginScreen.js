import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Eye, EyeOff, ArrowRight } from "lucide-react-native";
import { API_BASE_URL } from "../../config";
import { useRouter } from "expo-router";
import { motion } from "framer-motion";

export default function LoginScreen({ onLogin }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => setAnimationKey((prev) => prev + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error (${response.status}): Invalid credentials`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMessage = errorJson.message;
        } catch (e) {
          if (response.status === 404) errorMessage = "Error (404): Endpoint not found";
          if (response.status === 500) errorMessage = "Error (500): Internal Server Error";
        }

        alert(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      alert("Login successful!");
      onLogin(data);
      router.replace(data.role === "ROLE_ADMIN" ? "/admin" : "/home/Landing");

    } catch (error) {
      console.error("Login Network Error:", error);
      alert(`Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Left side background for tablets/large screens */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" }}
        style={styles.leftBackground}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.brandContainer}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>TP</Text>
          </View>
          <Text style={styles.brandTitle}>TaxiPoint</Text>
          <Text style={styles.brandSubtitle}>
            Seamless commuting and rank management for the modern era. Connect, commute, and control.
          </Text>
        </View>
      </ImageBackground>

      {/* Right side form */}
      <View style={styles.formContainer}>
        <motion.div key={animationKey}>
          <Text style={styles.welcomeText}>Welcome to TaxiPoint</Text>
          <Text style={styles.instructions}>Please enter your details to sign in.</Text>
        </motion.div>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.passwordLabelContainer}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry={!showPassword}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Sign In</Text>}
        </TouchableOpacity>

        {/* Social Buttons (disabled) */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialButton, styles.disabled]} disabled>
            <Text>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, styles.disabled]} disabled>
            <Text>Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text>
            Dont have an account?{" "}
            <Text style={styles.signupText} onPress={() => router.push("/register")}>
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  leftBackground: {
    flex: 1,
    width: "100%",
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  brandContainer: { alignItems: "center" },
  brandLogo: { width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  brandLogoText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  brandTitle: { fontSize: 40, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  brandSubtitle: { fontSize: 16, color: "#e0f0ff", textAlign: "center" },
  formContainer: { flex: 1, padding: 24 },
  welcomeText: { fontSize: 28, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  instructions: { fontSize: 16, color: "#666", marginBottom: 16, textAlign: "center" },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: "#333", marginBottom: 4 },
  passwordLabelContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 12, backgroundColor: "#f0f0f0" },
  submitButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  socialContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  socialButton: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center", marginHorizontal: 4 },
  disabled: { opacity: 0.6 },
  signupText: { color: "#2563eb", fontWeight: "bold" },
});
