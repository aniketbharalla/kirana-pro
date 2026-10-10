import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BillingScreen } from '../screens/bills/BillingScreen';
import { BillReceiptScreen } from '../screens/bills/BillReceiptScreen';
import { BillsHistoryScreen } from '../screens/bills/BillsHistoryScreen';
import { CheckoutModal } from '../components/bills/CheckoutModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { KhataScreen } from '../screens/khata/KhataScreen';
import { CustomerDetailScreen } from '../screens/khata/CustomerDetailScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SmartReorderScreen } from '../screens/procurement/SmartReorderScreen';
import { CustomerKhata, Invoice } from '@kirana-pro/shared';

export type BillsStackParamList = {
  BillingScreen: undefined;
  BillReceipt: { invoice: Invoice };
  BillsHistory: undefined;
  Khata: undefined;
  CustomerDetail: { customer: CustomerKhata };
  Analytics: undefined;
  SmartReorder: undefined;
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
        headerTintColor: '#7367F0',
        headerTitleStyle: { fontWeight: '700', color: '#4B465C' },
        headerStyle: { backgroundColor: '#F8F7FA' },
        contentStyle: { backgroundColor: '#F8F7FA' },
      }}
    >
      <Stack.Screen
        name="BillingScreen"
        component={BillingScreenWrapper}
        options={({ navigation }) => ({
          title: 'Kirana POS',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={() => navigation.navigate('Analytics')}
                activeOpacity={0.8}
              >
                <Feather name="bar-chart-2" size={13} color="#7367F0" style={{ marginRight: 4 }} />
                <Text style={styles.historyBtnText}>Profit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={() => navigation.navigate('Khata')}
                activeOpacity={0.8}
              >
                <Feather name="book" size={13} color="#7367F0" style={{ marginRight: 4 }} />
                <Text style={styles.historyBtnText}>Khata</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={() => navigation.navigate('BillsHistory')}
                activeOpacity={0.8}
              >
                <Feather name="file-text" size={13} color="#7367F0" style={{ marginRight: 4 }} />
                <Text style={styles.historyBtnText}>Bills</Text>
              </TouchableOpacity>
            </View>
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
      <Stack.Screen
        name="Khata"
        component={KhataScreen}
        options={{
          title: 'Customer Khata',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{
          title: 'Customer Ledger',
          headerBackTitle: 'Khata',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Dukaan Profit & Reports',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SmartReorder"
        component={SmartReorderScreen}
        options={{
          title: 'Smart Reorder',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  historyBtn: {
    backgroundColor: '#EDEBFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7367F0',
  },
});

