import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { subscribeToSyncStatus, processOfflineQueue } from '../../services/offlineSync';

export const SyncStatusBanner: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((count) => {
      setPendingCount(count);
      // Flash the banner when count changes
      if (count > 0) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    });
    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (isSyncing || pendingCount === 0) return;
    setIsSyncing(true);
    setLastSyncResult(null);
    try {
      const result = await processOfflineQueue();
      setLastSyncResult(
        result.failedCount > 0
          ? `${result.successCount} synced, ${result.failedCount} failed`
          : `${result.successCount} synced successfully`
      );
      setTimeout(() => setLastSyncResult(null), 3000);
    } catch {
      setLastSyncResult('Sync failed – will retry');
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't render if everything is synced and no transient message
  if (pendingCount === 0 && !lastSyncResult) return null;

  const isSynced = pendingCount === 0;

  return (
    <Animated.View
      style={[styles.banner, isSynced ? styles.bannerSynced : styles.bannerPending]}
    >
      <View style={styles.left}>
        <Feather
          name={isSynced ? 'check-circle' : 'refresh-cw'}
          size={14}
          color={isSynced ? '#28C76F' : '#FF9F43'}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.label} numberOfLines={1}>
          {lastSyncResult
            ? lastSyncResult
            : isSynced
            ? 'All data synced to cloud'
            : isSyncing
            ? 'Syncing…'
            : `${pendingCount} operation${pendingCount > 1 ? 's' : ''} saved offline`}
        </Text>
      </View>
      {!isSynced && !isSyncing && (
        <TouchableOpacity style={styles.syncBtn} onPress={handleSync} activeOpacity={0.8}>
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
  },
  bannerSynced: {
    backgroundColor: '#E8FADF',
    borderWidth: 1,
    borderColor: '#28C76F',
  },
  bannerPending: {
    backgroundColor: '#FFF0E1',
    borderWidth: 1,
    borderColor: '#FF9F43',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B465C',
    flex: 1,
  },
  syncBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

