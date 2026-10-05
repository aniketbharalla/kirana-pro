import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';

// Placeholder screen for store setup (Task 5) or main tabs (Task 4)
// These will be swapped when Task 4 and Task 5 are mounted.
const TempSetupOrHome: React.FC = () => {
  const { user, clearUser } = useAuthStore();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Welcome, {user?.displayName}!</Text>
      <Text style={styles.subtitle}>
        Store ID: {user?.storeId || 'None (Needs Store Setup)'}
      </Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={clearUser}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export const RootNavigator: React.FC<{
  MainComponent?: React.ComponentType<any>;
  SetupComponent?: React.ComponentType<any>;
}> = ({ MainComponent, SetupComponent }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !user?.storeId ? (
        SetupComponent ? <SetupComponent /> : <TempSetupOrHome />
      ) : (
        MainComponent ? <MainComponent /> : <TempSetupOrHome />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
