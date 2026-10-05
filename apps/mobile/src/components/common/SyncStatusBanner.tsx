import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { subscribeToSyncStatus, processOfflineQueue } from '../../services/offlineSync';
import { colors } from '../../theme';

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
          ? `⚠️ ${result.successCount} synced, ${result.failedCount} failed`
          : `✅ ${result.successCount} synced successfully`
      );
      setTimeout(() => setLastSyncResult(null), 3000);
    } catch {
      setLastSyncResult('❌ Sync failed – will retry');
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
        <Text style={styles.dot}>{isSynced ? '🟢' : '🟡'}</Text>
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
    borderRadius: 12,
  },
  bannerSynced: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bannerPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    fontSize: 14,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
