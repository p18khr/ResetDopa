import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, AppContext } from './src/context/AppContext';
import { signOut } from 'firebase/auth';
import { auth } from './src/config/firebase';

import Dashboard from './src/screens/Dashboard';
import UrgeLogger from './src/screens/UrgeLogger';
import Tasks from './src/screens/Tasks';
import Program from './src/screens/Program';
import Stats from './src/screens/Stats';
import Badges from './src/screens/Badges';
import LevelUp from './src/screens/LevelUp';
import CompanionChat from './src/screens/CompanionChat';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import Settings from './src/screens/Settings';
import Profile from './src/screens/Profile';
import LearnLaws from './src/screens/LearnLaws';
import LegalAcceptanceScreen from './src/screens/LegalAcceptanceScreen';
import { useEffect, useState } from 'react';
import ReactRef from 'react';

const navigationRef = React.createRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { /* log or ignore */ }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={{ color:'#1A1A1A', fontSize:16, marginBottom:8 }}>Something went wrong.</Text>
          <Text style={{ color:'#6B7280' }}>Try reloading the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Program') iconName = 'calendar';
          else if (route.name === 'UrgeLogger') iconName = 'flash';
          else if (route.name === 'Badges') iconName = 'trophy';
          else if (route.name === 'Chat') iconName = 'chatbubbles';
          else if (route.name === 'Stats') iconName = 'analytics';
          
          // Render standard tab icon for all routes
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Program" component={Program} />
      <Tab.Screen 
        name="UrgeLogger" 
        component={UrgeLogger}
        options={{ tabBarLabel: 'Urges' }}
      />
      <Tab.Screen name="Badges" component={Badges} />
      <Tab.Screen name="Stats" component={Stats} />
      {false && <Tab.Screen name="Chat" component={CompanionChat} />}
    </Tab.Navigator>
  );
}

// Root stack with a gentle fade between screens for smoother tour hops
function AppNavigator() {
  const { user, loading, hasAcceptedTerms, acceptanceLoaded } = useContext(AppContext);

  // Show a loader while global state or acceptance state is still resolving
  if (loading || (user && !acceptanceLoaded)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    // 'animation: fade' softens Settings → Dashboard and other quick transitions
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user && acceptanceLoaded ? (
        // User is logged in
        hasAcceptedTerms ? (
          // User accepted terms - show main app
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Tasks" component={Tasks} />
            <Stack.Screen name="Stats" component={Stats} />
            <Stack.Screen name="LevelUp" component={LevelUp} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="LearnLaws" component={LearnLaws} />
          </>
        ) : (
          // User not accepted terms yet - show legal screen
          <Stack.Screen name="LegalAcceptance" component={LegalAcceptanceScreen} />
        )
      ) : !user ? (
        // Not authenticated - show login/signup
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
        </>
      ) : null
      }
    </Stack.Navigator>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
          <BannerLayer />
        </SafeAreaProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;

function BannerLayer() {
  // AuthStatusBanner is disabled because:
  // 1. Navigation structure prevents unauthenticated users from accessing app screens
  // 2. When user is null, AppNavigator shows only Login/Signup screens
  // 3. When user is logged in, AppNavigator shows Main app with tabs
  // 4. There's no scenario where banner should appear
  // This prevents the banner from incorrectly showing on Login screen.
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
