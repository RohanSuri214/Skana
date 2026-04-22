import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import ScanFlowScreen from './src/screens/ScanFlowScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LearnScreen from './src/screens/LearnScreen';
import Theme from './src/utils/theme';
import { loadModel } from './src/utils/model';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TAB_LABELS = { Home: 'H', History: 'R', Learn: 'L' };
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Theme.accent,
    background: Theme.bg,
    card: Theme.bg,
    text: Theme.text,
    border: Theme.border,
    notification: Theme.suspicious,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(13,27,42,0.95)',
          borderTopColor: Theme.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: 28,
          height: 80,
        },
        tabBarActiveTintColor: Theme.accent,
        tabBarInactiveTintColor: Theme.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIcon: ({ focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
            <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>
              {TAB_LABELS[route.name] ?? route.name[0]}
            </Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingLogo}>Skana</Text>
      <ActivityIndicator size="large" color={Theme.accent} style={{ marginTop: 24 }} />
      <Text style={styles.loadingText}>Loading AI model...</Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadModel();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <>
        <StatusBar style="light" />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="ScanFlow"
            component={ScanFlowScreen}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 36,
    fontWeight: '800',
    color: Theme.accent,
    letterSpacing: -1,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.textSecondary,
    marginTop: 12,
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.bgCardLight,
    opacity: 0.75,
  },
  tabIconFocused: {
    backgroundColor: Theme.accent,
    opacity: 1,
  },
  tabIconText: {
    color: Theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabIconTextFocused: {
    color: Theme.text,
  },
});
