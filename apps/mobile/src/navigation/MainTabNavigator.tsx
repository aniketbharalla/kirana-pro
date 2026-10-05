import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BillsNavigator } from './BillsNavigator';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProductsNavigator } from './ProductsNavigator';
import { TarajuScreen } from '../screens/taraju/TarajuScreen';
import { PurchaseNavigator } from './PurchaseNavigator';
import { colors } from '../theme';

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Bills: undefined;
  Purchases: undefined;
  Taraju: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC<{
  ProductsComponent?: React.ComponentType<any>;
  TarajuComponent?: React.ComponentType<any>;
  PurchaseComponent?: React.ComponentType<any>;
}> = ({ ProductsComponent, TarajuComponent, PurchaseComponent }) => {
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
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Products', { screen: 'ProductList' });
          },
        })}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Taraju"
        component={TarajuComponent || TarajuScreen}
        options={{
          tabBarLabel: 'Taraju',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>⚖️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsNavigator}
        options={{
          tabBarLabel: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🧾</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={PurchaseComponent || PurchaseNavigator}
        options={{
          tabBarLabel: 'Wholesale',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🚚</Text>
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
