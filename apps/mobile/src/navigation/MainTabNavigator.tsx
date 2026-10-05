import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BillsPlaceholderScreen } from '../screens/bills/BillsPlaceholderScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProductsNavigator } from './ProductsNavigator';
import { colors } from '../theme';

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Taraju: undefined;
  Bills: undefined;
  Profile: undefined;
};

const TarajuTabPlaceholder: React.FC = () => (
  <View style={styles.center}>
    <Text style={styles.placeholderEmoji}>⚖️</Text>
    <Text style={styles.placeholderTitle}>Taraju Smart Scale</Text>
    <Text style={styles.placeholderSubtitle}>Loading price-to-weight calculator...</Text>
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC<{
  ProductsComponent?: React.ComponentType<any>;
  TarajuComponent?: React.ComponentType<any>;
}> = ({ ProductsComponent, TarajuComponent }) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsComponent || ProductsNavigator}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Taraju"
        component={TarajuComponent || TarajuTabPlaceholder}
        options={{
          tabBarLabel: 'Taraju',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>⚖️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsPlaceholderScreen}
        options={{
          tabBarLabel: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🧾</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Dukaan',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🏪</Text>
          ),
        }}
      />
    </Tab.Navigator>
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
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});
