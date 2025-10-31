import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';

interface EarningsData {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  totalDeliveries: number;
  averageEarningPerDelivery: number;
  hourlyRate: number;
}

interface EarningsHistory {
  id: string;
  date: string;
  amount: number;
  deliveries: number;
  type: 'daily' | 'weekly' | 'monthly';
}

export default function EarningsScreen() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'total'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setIsRefreshing(true);
      const [earningsResponse, historyResponse] = await Promise.all([
        deliveryAPI.getEarnings(selectedPeriod),
        deliveryAPI.getEarningsHistory(),
      ]);

      if (earningsResponse.data.success) {
        setEarnings(earningsResponse.data.data);
      }

      if (historyResponse.data.success) {
        setEarningsHistory(historyResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadEarningsData();
  };

  const getPeriodEarnings = () => {
    if (!earnings) return 0;
    switch (selectedPeriod) {
      case 'today': return earnings.todayEarnings;
      case 'week': return earnings.weekEarnings;
      case 'month': return earnings.monthEarnings;
      case 'total': return earnings.totalEarnings;
      default: return 0;
    }
  };

  const getPeriodDeliveries = () => {
    if (!earnings) return 0;
    switch (selectedPeriod) {
      case 'today': return earnings.todayDeliveries;
      case 'week': return earnings.weekDeliveries;
      case 'month': return earnings.monthDeliveries;
      case 'total': return earnings.totalDeliveries;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month', 'total'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.activePeriodButton,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.activePeriodButtonText,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEarningsCard = () => (
    <View style={styles.earningsCard}>
      <View style={styles.earningsHeader}>
        <Text style={styles.earningsTitle}>
          {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Earnings
        </Text>
        <Ionicons name="cash-outline" size={24} color="#4ECDC4" />
      </View>
      <Text style={styles.earningsAmount}>Rs. {getPeriodEarnings()}</Text>
      <Text style={styles.earningsSubtext}>
        {getPeriodDeliveries()} deliveries completed
      </Text>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="bicycle-outline" size={20} color="#FF6B35" />
        <Text style={styles.statValue}>{earnings?.averageEarningPerDelivery?.toFixed(0) || 0}</Text>
        <Text style={styles.statLabel}>Avg per Delivery</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={20} color="#A8E6CF" />
        <Text style={styles.statValue}>Rs. {earnings?.hourlyRate?.toFixed(0) || 0}</Text>
        <Text style={styles.statLabel}>Hourly Rate</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="star-outline" size={20} color="#FFE66D" />
        <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
    </View>
  );

  const renderEarningsHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>Earnings History</Text>
      {earningsHistory.length > 0 ? (
        earningsHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
              <Text style={styles.historyDeliveries}>
                {item.deliveries} deliveries
              </Text>
            </View>
            <Text style={styles.historyAmount}>Rs. {item.amount}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No earnings history yet</Text>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download-outline" size={20} color="#FF6B35" />
          <Text style={styles.actionText}>Export Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="card-outline" size={20} color="#FF6B35" />
          <Text style={styles.actionText}>Payment Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="analytics-outline" size={20} color="#FF6B35" />
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="help-circle-outline" size={20} color="#FF6B35" />
          <Text style={styles.actionText}>Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <Text style={styles.headerSubtitle}>
          Track your delivery earnings and performance
        </Text>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Earnings Card */}
      {renderEarningsCard()}

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Earnings History */}
      {renderEarningsHistory()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  earningsCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  earningsSubtext: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  historySection: {
    padding: 20,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyDeliveries: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});
