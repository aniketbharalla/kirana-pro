import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BillsNavigator } from './BillsNavigator';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProductsNavigator } from './ProductsNavigator';
import { TarajuScreen } from '../screens/taraju/TarajuScreen';
import { PurchaseNavigator } from './PurchaseNavigator';
import { MarketingScreen } from '../screens/marketing/MarketingScreen';
import { colors } from '../theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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
        tabBarInactiveTintColor: '#A8AAAE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#DBDADE',
          borderTopWidth: 1,
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={20} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Taraju"
        component={TarajuComponent || TarajuScreen}
        options={{
          tabBarLabel: 'Taraju',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scale-balance" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsNavigator}
        options={{
          tabBarLabel: 'Bills',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" size={21} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={PurchaseComponent || PurchaseNavigator}
        options={{
          tabBarLabel: 'Wholesale',
          tabBarIcon: ({ color, size }) => (
            <Feather name="truck" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Marketing"
        component={MarketingScreen}
        options={{
          tabBarLabel: 'Marketing',
          tabBarIcon: ({ color, size }) => (
            <Feather name="share-2" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Dukaan',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-bag" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
