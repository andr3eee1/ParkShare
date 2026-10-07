import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { PersonalInformationScreen } from './src/screens/settings/PersonalInformationScreen';
import { PaymentMethodsScreen } from './src/screens/settings/PaymentMethodsScreen';
import { MyVehiclesScreen } from './src/screens/settings/MyVehiclesScreen';
import { NotificationsScreen } from './src/screens/settings/NotificationsScreen';
import { SecurityScreen } from './src/screens/settings/SecurityScreen';
import { HelpSupportScreen } from './src/screens/settings/HelpSupportScreen';
import { PaymentCheckoutScreen } from './src/screens/PaymentCheckoutScreen';

import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { tokens } from './src/theme/tokens';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { PassesScreen } from './src/screens/PassesScreen';
import { MySpotsScreen } from './src/screens/MySpotsScreen';
import { AddSpotScreen } from './src/screens/AddSpotScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminManagementScreen, AdminRecordScreen } from './src/screens/AdminManagementScreens';
import { PassProvider } from './src/context/PassContext';
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
    const { user } = useContext(AuthContext);
    const insets = require('react-native-safe-area-context').useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 12);
    
    return (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              let iconName: any = 'map';
              if (route.name === 'Explore') iconName = 'search';
              else if (route.name === 'History') iconName = 'time';
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
          <Tab.Screen name="My Spots" component={MySpotsScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Passes" component={PassesScreen} />
          <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
  };

  const RootNavigator = () => {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paleMapBackground }}>
          <Text style={{ fontFamily: tokens.typography.heading, fontSize: 24, color: tokens.colors.primaryText }}>ParkShare</Text>
        </View>
      );
    }

    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user == null ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp" component={MainNavigator} />
              <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
              <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
              <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Security" component={SecurityScreen} />
                            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
              {user.role === 'ADMIN' ? (
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                  <Stack.Screen name="AdminUsers" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminSpaces" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminBookings" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminReports" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminRecord" component={AdminRecordScreen} />
                </>
              ) : null}
              <Stack.Screen name="AddSpot" component={AddSpotScreen} options={{ presentation: "modal" }} />
              <Stack.Screen name="PaymentCheckout" component={PaymentCheckoutScreen} options={{ presentation: "transparentModal", animation: "slide_from_bottom" }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const AppRoot = (
    <SafeAreaProvider>
      <PassProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PassProvider>
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
