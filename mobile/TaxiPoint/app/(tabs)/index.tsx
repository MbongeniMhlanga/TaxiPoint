import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Simple validation
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login Failed:', response.status, errorText);

        let errorMessage = `Error (${response.status}): Invalid credentials`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          if (response.status === 404) errorMessage = 'Error (404): Endpoint not found';
          if (response.status === 500) errorMessage = 'Error (500): Internal Server Error';
        }

        Alert.alert('Login Failed', errorMessage);
        return;
      }

      const data = await response.json();
      Alert.alert('Success', 'Login successful!');
      
      // Navigate based on role
      if (data.role === 'ROLE_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/(tabs)/explore');
      }
    } catch (error: any) {
      console.error('Login Network Error:', error);
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
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              Welcome to TaxiPoint
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>Please enter your details to sign in.</ThemedText>

            <View style={styles.formContainer}>
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <View style={styles.passwordLabelContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Password</ThemedText>
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Password recovery coming soon!')}>
                  <ThemedText style={[styles.forgotLink, { color: borderColor }]}>Forgot password?</ThemedText>
                </TouchableOpacity>
              </View>
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
                  value={password}
                  onChangeText={setPassword}
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

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: borderColor, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Sign in →</ThemedText>
                )}
              </TouchableOpacity>

              <ThemedText style={[styles.signupText, { color: secondaryTextColor }]}>
                Don't have an account?{' '}
                <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
                  <ThemedText style={[styles.signupLink, { color: borderColor }]}>Sign up</ThemedText>
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
    gap: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
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
  loginButton: {
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
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
  },
  signupLink: {
    fontWeight: 'bold',
  },
});
