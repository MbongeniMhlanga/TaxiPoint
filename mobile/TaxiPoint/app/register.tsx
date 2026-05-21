import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loader } from '@/components/loader';
import { getErrorMessage } from '@/utils/errorMessage';

import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface RegisterForm {
  name: string;
  surname: string;
  email: string;
  password: string;
  role: 'ROLE_USER' | 'ROLE_DRIVER';
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    surname: '',
    email: '',
    password: '',
    role: 'ROLE_USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.surname || !formData.email || !formData.password) {
      Alert.alert('Missing Details', 'Please complete all the registration fields.');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Password Too Short', 'Your password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration Failed:', response.status, errorText);
        const message = getErrorMessage(response.status, errorText, 'register');
        Alert.alert('Registration Failed', message);
        return;
      }

      await response.json();
      Alert.alert('Success', 'Registration successful! Please login.');
      router.push('/(tabs)');
    } catch (error: any) {
      console.error('Registration Error:', error);
      Alert.alert('Connection Problem', getErrorMessage(0, error, 'register'));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];

  const bgColor = colors.background;
  const textColor = colors.text;
  const inputBgColor = colors.secondaryBackground;
  const borderColor = colors.border;
  const primaryColor = colors.tint;
  const secondaryTextColor = colors.textSecondary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {loading && <Loader message="Creating your account..." />}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={loading}>
              <Ionicons name="arrow-back" size={24} color={primaryColor} />
            </TouchableOpacity>

            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              Create Account
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>Enter your details to register.</ThemedText>

            <View style={styles.formContainer}>
              {/* Name and Surname Row */}
              <View style={styles.rowContainer}>
                <View style={styles.halfInput}>
                  <ThemedText style={[styles.label, { color: textColor }]}>Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBgColor,
                      },
                    ]}
                    placeholder="Name"
                    placeholderTextColor={isDark ? '#888' : '#ccc'}
                    value={formData.name}
                    onChangeText={(value) => handleChange('name', value)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={styles.halfInput}>
                  <ThemedText style={[styles.label, { color: textColor }]}>Surname</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBgColor,
                      },
                    ]}
                    placeholder="Surname"
                    placeholderTextColor={isDark ? '#888' : '#ccc'}
                    value={formData.surname}
                    onChangeText={(value) => handleChange('surname', value)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email */}
              <ThemedText style={[styles.label, { color: textColor }]}>Email Address</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: borderColor,
                    color: textColor,
                    backgroundColor: inputBgColor,
                  },
                ]}
                placeholder="user@example.com"
                placeholderTextColor={isDark ? '#888' : '#ccc'}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              {/* Password */}
              <ThemedText style={[styles.label, { color: textColor }]}>Password</ThemedText>
              <View style={[styles.passwordInput, { borderColor: borderColor, backgroundColor: inputBgColor }]}>
                <TextInput
                  style={[
                    styles.passwordTextInput,
                    {
                      color: textColor,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#888' : '#ccc'}
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}>
                  <ThemedText style={{ color: secondaryTextColor, fontSize: 18 }}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText style={[styles.passwordHelp, { color: secondaryTextColor }]}>
                Use at least 6 characters. A mix of letters and numbers is recommended.
              </ThemedText>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: primaryColor, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleRegister}
                disabled={loading}>
                <ThemedText style={styles.registerButtonText}>Create Account →</ThemedText>
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <ThemedText style={[styles.footerText, { color: secondaryTextColor }]}>
                  Already have an account?
                </ThemedText>
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                  <ThemedText style={[styles.loginLink, { color: primaryColor }]}>Login</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  backButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    textAlign: 'left',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: 30,
    fontSize: 14,
  },
  formContainer: {
    gap: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  passwordTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordHelp: {
    marginTop: -2,
    fontSize: 12,
    lineHeight: 18,
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
