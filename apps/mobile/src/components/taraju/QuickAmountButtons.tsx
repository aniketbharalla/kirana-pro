import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

export interface QuickAmountButtonsProps {
  onSelectAmount: (amount: number) => void;
  selectedAmount?: number;
}

export const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export const QuickAmountButtons: React.FC<QuickAmountButtonsProps> = ({
  onSelectAmount,
  selectedAmount,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>QUICK AMOUNT (₹)</Text>
      <View style={styles.chipsRow}>
        {PRESET_AMOUNTS.map((amt) => {
          const isSelected = selectedAmount === amt;
          return (
            <TouchableOpacity
              key={amt}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectAmount(amt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
