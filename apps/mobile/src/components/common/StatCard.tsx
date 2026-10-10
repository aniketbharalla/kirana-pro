import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtext?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = colors.primary,
  subtext,
  onPress,
}) => {
  const content = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}18` }]}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
      </View>
      <Text style={styles.titleText}>{title}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{content}</View>;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    minWidth: '46%',
    margin: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBDADE',
    shadowColor: '#A5A3AE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  subtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
