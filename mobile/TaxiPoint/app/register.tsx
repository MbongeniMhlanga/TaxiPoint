import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration Failed:', response.status, errorText);

        let errorMessage = `Error (${response.status}): Registration failed`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (err) {
          if (response.status === 404) errorMessage = 'Error (404): Endpoint not found';
          if (response.status === 409) errorMessage = 'Error (409): User already exists';
          if (response.status === 500) errorMessage = 'Error (500): Internal Server Error';
        }

        Alert.alert('Registration Failed', errorMessage);
        return;
      }

      await response.json();
      Alert.alert('Success', 'Registration successful! Please login.');
      router.push('/(tabs)');
    } catch (error: any) {
      console.error('Registration Error:', error);
      Alert.alert('Connection Error', `Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const inputBgColor = isDark ? '#1a1a1a' : '#f5f5f5';
  const borderColor = Colors[isDark ? 'dark' : 'light'].tint;
  const secondaryTextColor = isDark ? '#888' : '#666';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={loading}>
              <ThemedText style={[styles.backText, { color: borderColor }]}>← Back</ThemedText>
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

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: borderColor, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.registerButtonText}>Create Account →</ThemedText>
                )}
              </TouchableOpacity>

              <ThemedText style={[styles.loginText, { color: secondaryTextColor }]}>
                Already have an account?{' '}
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                  <ThemedText style={[styles.loginLink, { color: borderColor }]}>Login</ThemedText>
                </TouchableOpacity>
              </ThemedText>
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
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
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
  loginText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
  },
  loginLink: {
    fontWeight: 'bold',
  },
});
