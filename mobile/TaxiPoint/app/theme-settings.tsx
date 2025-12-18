import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ThemeSettingsScreen() {
  const { theme, setTheme, colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ThemedText type="title" style={styles.title}>Theme Settings</ThemedText>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.secondaryBackground }, theme === 'light' && { backgroundColor: themeColors.tint }]}
        onPress={() => setTheme('light')}
      >
        <ThemedText style={theme === 'light' && { color: '#fff' }}>Light</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.secondaryBackground }, theme === 'dark' && { backgroundColor: themeColors.tint }]}
        onPress={() => setTheme('dark')}
      >
        <ThemedText style={theme === 'dark' && { color: '#fff' }}>Dark</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.secondaryBackground }, theme === 'system' && { backgroundColor: themeColors.tint }]}
        onPress={() => setTheme('system')}
      >
        <ThemedText style={theme === 'system' && { color: '#fff' }}>System Default</ThemedText>
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
    width: 200,
    alignItems: 'center',
  },
});
