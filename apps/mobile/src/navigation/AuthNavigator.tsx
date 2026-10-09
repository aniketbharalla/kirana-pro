import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { PhoneLoginScreen } from '../screens/auth/PhoneLoginScreen';
import { StaffLoginScreen } from '../screens/auth/StaffLoginScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneLogin: undefined;
  StaffLogin: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="PhoneLogin"
        component={PhoneLoginScreen}
        options={{
          headerShown: true,
          title: 'Store Owner Login',
          headerBackTitle: 'Back',
          headerTintColor: '#10B981',
          headerStyle: { backgroundColor: '#F8FAFC' },
        }}
      />
      <Stack.Screen
        name="StaffLogin"
        component={StaffLoginScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
