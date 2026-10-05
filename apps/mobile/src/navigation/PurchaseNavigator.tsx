import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupplierListScreen } from '../screens/purchase/SupplierListScreen';
import { AddSupplierScreen } from '../screens/purchase/AddSupplierScreen';
import { CreatePurchaseScreen } from '../screens/purchase/CreatePurchaseScreen';
import { ScanInvoiceScreen } from '../screens/purchase/ScanInvoiceScreen';
import { ReviewInvoiceScreen } from '../screens/purchase/ReviewInvoiceScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export const PurchaseNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="SupplierList"
        component={SupplierListScreen}
        options={{ title: 'Wholesale & Inwarding (खरीददारी)' }}
      />
      <Stack.Screen
        name="AddSupplier"
        component={AddSupplierScreen}
        options={{ title: 'Add Wholesaler' }}
      />
      <Stack.Screen
        name="CreatePurchase"
        component={CreatePurchaseScreen}
        options={{ title: 'Inward Stock Options' }}
      />
      <Stack.Screen
        name="ScanInvoice"
        component={ScanInvoiceScreen}
        options={{ title: 'Scan Distributor Bill (OCR)' }}
      />
      <Stack.Screen
        name="ReviewInvoice"
        component={ReviewInvoiceScreen}
        options={{ title: 'Review Extracted Bill' }}
      />
    </Stack.Navigator>
  );
};
