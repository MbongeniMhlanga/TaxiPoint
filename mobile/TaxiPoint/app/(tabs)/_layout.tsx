import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 10);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: true,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          height: 48 + bottomInset,
          width: 220,
          alignSelf: 'center',
          paddingTop: 0,
          paddingBottom: bottomInset,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                marginHorizontal: 0,
                marginBottom: bottomInset,
                borderRadius: 30,
                backgroundColor: colors.background,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: colorScheme === 'dark' ? 0.28 : 0.12,
                shadowRadius: 12,
              },
            ]}
          />
        ),
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>

      {/* Hide the Login screen from the Tab Bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* Home icon goes to Explore page */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* Account Tab */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="line.3.horizontal" color={color} />,
        }}
      />
    </Tabs>
  );
}
