import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { tokens } from './src/theme/tokens';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Placeholder screens for other tabs
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paleMapBackground }}>
    <Text style={{ fontFamily: tokens.typography.heading, fontSize: 24 }}>{name}</Text>
  </View>
);

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk: SpaceGrotesk_400Regular,
    SpaceGrotesk_Medium: SpaceGrotesk_500Medium,
    SpaceGrotesk_Bold: SpaceGrotesk_700Bold,
    Inter: Inter_400Regular,
    Inter_Medium: Inter_500Medium,
    Inter_SemiBold: Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const MainNavigator = () => {
    const insets = require('react-native-safe-area-context').useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 12);
    
    return (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              let iconName: any = 'map';
              if (route.name === 'Explore') iconName = 'search';
              else if (route.name === 'Bookings') iconName = 'calendar';
              else if (route.name === 'Passes') iconName = 'card';
              else if (route.name === 'Account') iconName = 'person';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: tokens.colors.primaryText,
            tabBarInactiveTintColor: tokens.colors.secondaryText,
            tabBarStyle: {
              backgroundColor: tokens.colors.white,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              height: 60 + bottomPadding,
              paddingBottom: bottomPadding,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontFamily: tokens.typography.body,
              fontSize: 11,
              fontWeight: '500',
            }
          })}
        >
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="Bookings" children={() => <PlaceholderScreen name="Bookings" />} />
          <Tab.Screen name="Passes" children={() => <PlaceholderScreen name="Passes" />} />
          <Tab.Screen name="Account" children={() => <PlaceholderScreen name="Account" />} />
        </Tab.Navigator>
    );
  };

  const AppRoot = (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="MainApp" component={MainNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        {AppRoot}
      </View>
    );
  }

  return AppRoot;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#EEF2F5',
  },
  mobileContainer: {
    // Deprecated fixed size constraints
  },
});
