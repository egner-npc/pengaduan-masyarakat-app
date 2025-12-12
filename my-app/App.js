import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/services/auth';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ComplaintFormScreen from './src/screens/ComplaintFormScreen';
import ComplaintDetailScreen from './src/screens/ComplaintDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: true,
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      >
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ title: 'Daftar Akun' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ 
                title: `Halo, ${user.nama}`,
                headerRight: () => null
              }}
            />
            <Stack.Screen 
              name="ComplaintForm" 
              component={ComplaintFormScreen}
              options={{ title: 'Buat Pengaduan' }}
            />
            <Stack.Screen 
              name="ComplaintDetail" 
              component={ComplaintDetailScreen}
              options={{ title: 'Detail Pengaduan' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}