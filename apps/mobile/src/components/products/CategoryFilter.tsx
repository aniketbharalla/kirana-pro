import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PRODUCT_CATEGORIES } from '@kirana-pro/shared';
import { colors } from '../../theme';

export interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        <TouchableOpacity
          style={[styles.pill, selectedCategory === null && styles.pillActive]}
          onPress={() => onSelectCategory(null)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.pillText, selectedCategory === null && styles.pillTextActive]}
          >
            All Items
          </Text>
        </TouchableOpacity>

        {PRODUCT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => onSelectCategory(isSelected ? null : cat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {cat.name} {cat.nameHindi ? `(${cat.nameHindi})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
