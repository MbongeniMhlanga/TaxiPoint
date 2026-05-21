import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoaderProps = {
  message?: string;
};

export function Loader({ message = 'Loading...' }: LoaderProps) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    zIndex: 9999,
  },
  card: {
    minWidth: 150,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
});
