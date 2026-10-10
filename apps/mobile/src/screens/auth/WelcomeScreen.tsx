import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { signInWithGooglePopup } from '../../services/auth';
import { Feather } from '@expo/vector-icons';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGooglePopup();
      // On success, useAuthStore updates and root navigator automatically switches to MainTabs
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // If popup was cancelled or failed
      if (err.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Sign-In Error', err.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FA" />
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Feather name="shopping-bag" size={38} color="#7367F0" />
          </View>
          <Text style={styles.brandTitle}>Kirana Pro</Text>
          <Text style={styles.tagline}>Apni dukaan, apne haath mein</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>100% Free • Enterprise Kirana OS</Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Feather name="sliders" size={18} color="#7367F0" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Taraju Price-to-Weight</Text>
              <Text style={styles.featureSub}>₹5 ka chawal? Grams calculated in 1-tap</Text>
            </View>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Feather name="camera" size={18} color="#7367F0" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Instant Camera Barcode</Text>
              <Text style={styles.featureSub}>Auto-filled via Open Food Facts catalog</Text>
            </View>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Feather name="zap" size={18} color="#7367F0" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Instant POS & Stock Sync</Text>
              <Text style={styles.featureSub}>Real-time stock alerts & free billing</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Owner Login Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('PhoneLogin')}
          >
            <View style={styles.btnRow}>
              <Feather name="shield" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Store Owner Login (Mobile)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && { opacity: 0.7 }]}
            activeOpacity={0.88}
            disabled={isGoogleLoading}
            onPress={handleGoogleSignIn}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#7367F0" />
            ) : (
              <View style={styles.btnRow}>
                <Feather name="globe" size={16} color="#2F2B3D" style={{ marginRight: 8 }} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Persona Separator */}
          <View style={styles.orDividerContainer}>
            <View style={styles.orDividerLine} />
            <Text style={styles.orDividerText}>OR CASHIER COUNTER</Text>
            <View style={styles.orDividerLine} />
          </View>

          {/* Cashier / Staff Login Button */}
          <TouchableOpacity
            style={styles.staffButton}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('StaffLogin')}
          >
            <View style={styles.btnRow}>
              <Feather name="user" size={16} color="#7367F0" style={{ marginRight: 8 }} />
              <Text style={styles.staffButtonText}>Staff Counter Login (Phone + PIN)</Text>
            </View>
            <Text style={styles.staffButtonSub}>Open counter shift register & galla</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            By signing in, you agree to Kirana Pro's Terms of Service.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2F2B3D',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#6F6B7D',
    marginTop: 4,
    fontWeight: '500',
  },
  pillBadge: {
    marginTop: 10,
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7367F0',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  featureSub: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 2,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F8F7FA',
    marginVertical: 4,
  },
  actionSection: {
    gap: 10,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  googleButtonText: {
    color: '#2F2B3D',
    fontSize: 14,
    fontWeight: '600',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DBDADE',
  },
  orDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8AAAE',
    letterSpacing: 0.8,
  },
  staffButton: {
    backgroundColor: '#EDEBFD',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  staffButtonText: {
    color: '#7367F0',
    fontSize: 14,
    fontWeight: '700',
  },
  staffButtonSub: {
    color: '#5E50EE',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#A8AAAE',
    textAlign: 'center',
    marginTop: 4,
  },
});
