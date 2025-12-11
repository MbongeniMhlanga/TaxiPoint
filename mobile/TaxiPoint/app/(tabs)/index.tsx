import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Simple validation
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    // Simulate login
    Alert.alert('Success', `Welcome ${email}!`);
    // TODO: Add actual authentication here
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          TaxiPoint
        </ThemedText>
        <ThemedText style={styles.subtitle}>Login to your account</ThemedText>

        <View style={styles.formContainer}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: Colors[isDark ? 'dark' : 'light'].tint,
                color: isDark ? '#fff' : '#000',
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={isDark ? '#888' : '#ccc'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: Colors[isDark ? 'dark' : 'light'].tint,
                color: isDark ? '#fff' : '#000',
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              },
            ]}
            placeholder="Enter your password"
            placeholderTextColor={isDark ? '#888' : '#ccc'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint },
            ]}
            onPress={handleLogin}>
            <ThemedText style={styles.loginButtonText}>Login</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.signupText}>
            Don't have an account? <ThemedText style={styles.signupLink}>Sign up</ThemedText>
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.7,
  },
  formContainer: {
    gap: 16,
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
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
    color: '#0066cc',
  },
});
