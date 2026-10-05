import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🏪</Text>
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
            <Text style={styles.featureBullet}>⚖️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Taraju Price-to-Weight</Text>
              <Text style={styles.featureSub}>₹5 ka chawal? Grams calculated in 1-tap</Text>
            </View>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📷</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Instant Camera Barcode</Text>
              <Text style={styles.featureSub}>Auto-filled via Open Food Facts catalog</Text>
            </View>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>⚡</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Instant POS & Stock Sync</Text>
              <Text style={styles.featureSub}>Real-time stock alerts & free billing</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('PhoneLogin')}
          >
            <Text style={styles.primaryButtonText}>📱 Continue with Mobile Number</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.88}
            onPress={() => {
              // Navigation or Google Sign In trigger
              navigation.navigate('PhoneLogin');
            }}
          >
            <Text style={styles.googleButtonText}>🌐 Continue with Google</Text>
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  logoEmoji: {
    fontSize: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  pillBadge: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureBullet: {
    fontSize: 24,
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  featureSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  actionSection: {
    gap: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
