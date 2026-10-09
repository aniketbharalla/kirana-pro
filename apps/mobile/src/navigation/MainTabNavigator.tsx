import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BillsNavigator } from './BillsNavigator';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProductsNavigator } from './ProductsNavigator';
import { TarajuScreen } from '../screens/taraju/TarajuScreen';
import { PurchaseNavigator } from './PurchaseNavigator';
import { MarketingScreen } from '../screens/marketing/MarketingScreen';
import { colors } from '../theme';

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Bills: undefined;
  Purchases: undefined;
  Taraju: undefined;
  Marketing: undefined;
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
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(60, 60, 67, 0.12)',
          borderTopWidth: 0.5,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.03,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: -0.1,
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
            (navigation as any).navigate('Products', { screen: 'ProductList' });
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
        name="Marketing"
        component={MarketingScreen}
        options={{
          tabBarLabel: 'Marketing',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📲</Text>
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
