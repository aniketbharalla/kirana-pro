import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface ToastBannerProps {
  type: 'success' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  style?: ViewStyle;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({
  type,
  title,
  message,
  onClose,
  style,
}) => {
  const isSuccess = type === 'success';

  return (
    <View
      style={[
        styles.toastCard,
        { backgroundColor: isSuccess ? '#C2E7D0' : '#F7C2C7' },
        style,
      ]}
    >
      {/* Decorative organic background blobs */}
      <View
        style={[
          styles.bgBlobTop,
          { backgroundColor: isSuccess ? '#A7DCB9' : '#F4AEB6' },
        ]}
      />
      <View
        style={[
          styles.bgBlobBottom,
          { backgroundColor: isSuccess ? '#99D4AC' : '#EDA0AA' },
        ]}
      />

      {/* Pure White Circular Icon Badge */}
      <View style={styles.iconCircle}>
        {isSuccess ? (
          <Feather name="check" size={24} color="#238352" />
        ) : (
          <Feather name="alert-circle" size={24} color="#D32F2F" />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {message ? (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        ) : null}
      </View>

      {/* Close Button */}
      {onClose ? (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather
            name="x"
            size={18}
            color={isSuccess ? '#487163' : '#8C575D'}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  toastCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },
  bgBlobTop: {
    position: 'absolute',
    top: -16,
    left: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.85,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -18,
    left: 14,
    width: 66,
    height: 66,
    borderRadius: 33,
    opacity: 0.7,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#374151',
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
