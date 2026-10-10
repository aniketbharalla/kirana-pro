import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { AddProductScreen } from '../screens/products/AddProductScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { BarcodeScannerScreen } from '../screens/products/BarcodeScannerScreen';
import { StockInScreen } from '../screens/stock/StockInScreen';
import { colors } from '../theme';

import { ErrorBoundary } from '../components/common/ErrorBoundary';

export type ProductsStackParamList = {
  ProductList: undefined;
  AddProduct: { barcode?: string; name?: string; isLoose?: boolean; unit?: string } | undefined;
  ProductDetail: { productId: string };
  BarcodeScanner: undefined;
  StockIn: { productId: string } | undefined;
};

const Stack = createNativeStackNavigator<ProductsStackParamList>();

const SafeProductListScreen: React.FC = (props: any) => (
  <ErrorBoundary componentName="ProductListScreen">
    <ProductListScreen {...props} />
  </ErrorBoundary>
);

const SafeAddProductScreen: React.FC = (props: any) => (
  <ErrorBoundary componentName="AddProductScreen">
    <AddProductScreen {...props} />
  </ErrorBoundary>
);

const SafeProductDetailScreen: React.FC = (props: any) => (
  <ErrorBoundary componentName="ProductDetailScreen">
    <ProductDetailScreen {...props} />
  </ErrorBoundary>
);

export const ProductsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProductList"
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        headerStyle: { backgroundColor: '#F8FAFC' },
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen
        name="ProductList"
        component={SafeProductListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={SafeAddProductScreen}
        options={{ title: 'Add New Product', headerBackTitle: 'Cancel' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={SafeProductDetailScreen}
        options={{ title: 'Item Details', headerBackTitle: 'Catalog' }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{
          title: 'Scan Barcode',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#7367F0',
          headerTitleStyle: { color: '#FFFFFF', fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="StockIn"
        component={StockInScreen}
        options={{ title: 'Inward Stock', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
};
