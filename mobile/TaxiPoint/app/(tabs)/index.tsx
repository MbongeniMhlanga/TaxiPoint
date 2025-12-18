import { useAuth } from '@/context/AuthContext';
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
  const { login, user, isLoading, isAdmin } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  React.useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/(tabs)/explore');
      }
    }
  }, [user, isLoading, isAdmin]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        if (response.status === 401) {
          Alert.alert('Login Failed', 'Wrong credentials, please try again');
        } else {
          Alert.alert('Login Failed', 'Something went wrong. Please try again later.');
          const errorText = await response.text();
          console.error('Login Error:', response.status, errorText);
        }
        return;
      }

      const data = await response.json();
      console.log('Login successful with role:', data.role);

      // Store in context
      login(email, data.role, data.token);

      if (data.role === 'ADMIN' || data.role === 'ROLE_ADMIN') {
        router.replace({
          pathname: '/admin/dashboard',
          params: { token: data.token, email: email }
        });
      } else {
        // Navigate to explore screen - use relative navigation
        router.navigate('../(tabs)/explore');
      }
    } catch (error: any) {
      console.error('Login Network Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Connection Error', `Connection failed: ${errorMsg}`);
    } finally {
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
                  <ThemedText style={[styles.forgotLink, { color: primaryColor }]}>Forgot password?</ThemedText>
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
                  { backgroundColor: primaryColor, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Sign in →</ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <ThemedText style={[styles.footerText, { color: secondaryTextColor }]}>
                  Don&apos;t have an account?
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
                  <ThemedText style={[styles.signupLink, { color: primaryColor }]}>Sign up</ThemedText>
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
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
