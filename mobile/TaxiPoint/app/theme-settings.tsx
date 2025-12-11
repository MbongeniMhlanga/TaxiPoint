import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ThemeSettingsScreen() {
  const { theme, setTheme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Theme Settings</ThemedText>
      <TouchableOpacity
        style={[styles.button, theme === 'light' && styles.selected]}
        onPress={() => setTheme('light')}
      >
        <ThemedText>Light</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, theme === 'dark' && styles.selected]}
        onPress={() => setTheme('dark')}
      >
        <ThemedText>Dark</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, theme === 'system' && styles.selected]}
        onPress={() => setTheme('system')}
      >
        <ThemedText>System Default</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#eee',
    width: 200,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#0a7ea4',
  },
});
