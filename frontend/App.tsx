import { AlertProvider } from "./src/context/AlertContext";
import React, { useEffect } from 'react';
import { View, Platform, Text, Image } from 'react-native';
import { NavigationContainer, getStateFromPath, getPathFromState } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { StandingScreen } from './src/screens/StandingScreen';
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
import { styles } from './App.styles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Placeholder screens for other tabs
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paleMapBackground }}>
    <Text style={{ fontFamily: tokens.typography.heading, fontSize: 24 }}>{name}</Text>
  </View>
);

const linking = {
  prefixes: [
    'https://park-share.ro/platform',
    'http://localhost:8081/platform',
    'http://localhost:8081',
    'parkshare://',
    '/platform',
  ],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ResetPassword: 'reset-password',
      VerifyEmail: 'verify-email',
      MainApp: {
        path: '',
        screens: {
          Explore: 'explore',
          'My Spots': 'my-spots',
          History: 'history',
          Passes: 'passes',
          Account: 'account',
        },
      },
      Standing: 'standing',
      PersonalInformation: 'profile',
      PaymentMethods: 'payment-methods',
      MyVehicles: 'vehicles',
      Notifications: 'notifications',
      Security: 'security',
      HelpSupport: 'support',
      AddSpot: 'add-spot',
      PaymentCheckout: 'checkout',
      AdminDashboard: 'admin',
      AdminUsers: 'admin/users',
      AdminSpaces: 'admin/spaces',
      AdminBookings: 'admin/bookings',
      AdminReports: 'admin/reports',
      AdminEmails: 'admin/emails',
      AdminRecord: 'admin/record',
    },
  },
  getStateFromPath(path: string, options: any) {
    let clean = path;
    if (clean.includes('://')) {
      try {
        const parsed = new URL(clean);
        clean = parsed.pathname + parsed.search;
      } catch {}
    }
    if (clean.startsWith('/platform')) {
      clean = clean.slice('/platform'.length);
    }
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    if (clean.startsWith('/wallet')) clean = clean.replace(/^\/wallet/, '/payment-methods');
    if (clean.startsWith('/bookings')) clean = clean.replace(/^\/bookings/, '/history');
    if (clean.startsWith('/provider')) clean = clean.replace(/^\/provider/, '/my-spots');

    const state = getStateFromPath(clean, options);
    if (!state) return state;

    // Delete any cached route.path so React Navigation will always delegate URL serialization
    // to getPathFromState, preserving the /platform prefix on refreshes and route transitions
    const stripRoutePaths = (obj: any) => {
      if (!obj || !obj.routes) return;
      for (const r of obj.routes) {
        if ('path' in r) {
          delete r.path;
        }
        if (r.state) {
          stripRoutePaths(r.state);
        }
      }
    };
    stripRoutePaths(state);

    return state;
  },
  getPathFromState(state: any, options: any) {
    const p = getPathFromState(state, options);
    if (Platform.OS === 'web') {
      const clean = p.startsWith('/') ? p : `/${p}`;
      if (clean.startsWith('/platform')) {
        return clean;
      }
      return `/platform${clean === '/' ? '' : clean}`;
    }
    return p;
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk: SpaceGrotesk_400Regular,
    SpaceGrotesk_Medium: SpaceGrotesk_500Medium,
    SpaceGrotesk_Bold: SpaceGrotesk_700Bold,
    Inter: Inter_400Regular,
    Inter_Medium: Inter_500Medium,
    Inter_SemiBold: Inter_600SemiBold,
  });

  // Ensure web URLs always maintain the /platform base path (must be called unconditionally before early return)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p !== '/' && !p.startsWith('/platform') && !p.startsWith('/api') && !p.startsWith('/_')) {
        window.history.replaceState(null, '', `/platform${p}${window.location.search}`);
      }
    }
  }, []);

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
            tabBarActiveTintColor: tokens.colors.emerald,
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
        <View style={styles.loadingContainer}>
          <Image source={require('./assets/logo-mark.png')} style={styles.loadingMark} resizeMode="contain" />
          <Text style={styles.loadingTitle}>ParkShare</Text>
        </View>
      );
    }

    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user == null ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp" component={MainNavigator} />
              <Stack.Screen name="Standing" component={StandingScreen} />
              <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
              <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
              <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Security" component={SecurityScreen} />
              <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
              {user.role === 'ADMIN' ? (
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                  <Stack.Screen name="AdminUsers" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminSpaces" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminBookings" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminReports" component={AdminManagementScreen} />
                  <Stack.Screen name="AdminEmails" component={AdminManagementScreen} />
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
      <AlertProvider>
        <PassProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PassProvider>
      </AlertProvider>
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
