import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

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
          <Text style={styles.modeBadgeText}>
            {isAmountToWeight ? '⚖️ EXACT WEIGHT TO MEASURE' : '💰 TOTAL AMOUNT TO CHARGE'}
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
    backgroundColor: '#065F46',
    borderRadius: 22,
    padding: 20,
    marginVertical: 14,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rateText: {
    color: '#D1FAE5',
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryText: {
    color: '#ECFDF5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
