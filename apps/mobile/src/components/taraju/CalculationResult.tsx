import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface CalculationResultProps {
  mode: 'amount_to_weight' | 'weight_to_price';
  resultDisplay: string;
  rate: number;
  inputDisplay: string;
}

export const CalculationResult: React.FC<CalculationResultProps> = ({
  mode,
  resultDisplay,
  rate,
  inputDisplay,
}) => {
  const isAmountToWeight = mode === 'amount_to_weight';

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.modeBadge}>
          {isAmountToWeight ? (
            <MaterialCommunityIcons name="scale-balance" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
          ) : (
            <Feather name="credit-card" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          )}
          <Text style={styles.modeBadgeText}>
            {isAmountToWeight ? 'EXACT WEIGHT TO MEASURE' : 'TOTAL AMOUNT TO CHARGE'}
          </Text>
        </View>
        <Text style={styles.rateText}>Rate: ₹{rate}/kg</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.mainValue}>{resultDisplay}</Text>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {isAmountToWeight
            ? `Customer asks for ₹${inputDisplay || '0'} → Put ${resultDisplay} on scale`
            : `Scale weighs ${inputDisplay || '0'}g → Collect ${resultDisplay} from customer`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary, // MasterX signature Royal Purple #7367F0
    borderRadius: 18,
    padding: 20,
    marginVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rateText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '700',
  },
  valueRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  summaryBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryText: {
    color: '#EDEBFD',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
