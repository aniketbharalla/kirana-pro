import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BillingScreen } from '../screens/bills/BillingScreen';
import { BillReceiptScreen } from '../screens/bills/BillReceiptScreen';
import { BillsHistoryScreen } from '../screens/bills/BillsHistoryScreen';
import { CheckoutModal } from '../components/bills/CheckoutModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Invoice } from '@kirana-pro/shared';

export type BillsStackParamList = {
  BillingScreen: undefined;
  BillReceipt: { invoice: Invoice };
  BillsHistory: undefined;
};

const Stack = createNativeStackNavigator<BillsStackParamList>();

const BillingScreenWrapper: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  return (
    <ErrorBoundary componentName="BillingScreen">
      <BillingScreen onOpenCheckout={() => setCheckoutVisible(true)} />
      <CheckoutModal
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={(inv) => {
          setCheckoutVisible(false);
          navigation.navigate('BillReceipt', { invoice: inv });
        }}
      />
    </ErrorBoundary>
  );
};

export const BillsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="BillingScreen"
      screenOptions={{
        headerTintColor: '#10B981',
        headerTitleStyle: { fontWeight: '800', color: '#0F172A' },
        headerStyle: { backgroundColor: '#F8FAFC' },
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen
        name="BillingScreen"
        component={BillingScreenWrapper}
        options={({ navigation }) => ({
          title: 'Kirana POS',
          headerRight: () => (
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('BillsHistory')}
            >
              <Text style={styles.historyBtnText}>📜 History</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="BillReceipt"
        component={BillReceiptScreen}
        options={{
          title: 'Invoice Receipt',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="BillsHistory"
        component={BillsHistoryScreen}
        options={{
          title: 'Sales & Invoices History',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  historyBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
});
