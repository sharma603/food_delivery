import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDistanceKm } from '../../utils/formatters';

export interface OrderCardProps {
  id: string;
  orderId: string;
  customerName: string;
  customerAddress: string;
  restaurantName: string;
  status: string;
  totalAmount: number;
  distance?: number;
  isAvailable?: boolean;
  onPress?: (id: string) => void;
  onAccept?: (id: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  id,
  orderId,
  customerName,
  customerAddress,
  restaurantName,
  status,
  totalAmount,
  distance,
  isAvailable,
  onPress,
  onAccept,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(id)}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{orderId}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{status}</Text></View>
      </View>

      <View style={styles.info}>
        <View style={styles.row}><Ionicons name="restaurant-outline" size={16} color="#666" /><Text style={styles.infoText}>{restaurantName}</Text></View>
        <View style={styles.row}><Ionicons name="person-outline" size={16} color="#666" /><Text style={styles.infoText}>{customerName}</Text></View>
        <View style={styles.row}><Ionicons name="location-outline" size={16} color="#666" /><Text style={styles.infoText} numberOfLines={1}>{customerAddress}</Text></View>
        <View style={styles.row}><Ionicons name="cash-outline" size={16} color="#666" /><Text style={styles.infoText}>{formatCurrency(totalAmount)}</Text></View>
        {!!distance && (
          <View style={styles.row}><Ionicons name="navigate-outline" size={16} color="#666" /><Text style={styles.infoText}>{formatDistanceKm(distance)}</Text></View>
        )}
      </View>

      {isAvailable && (
        <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept && onAccept(id)}>
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FF6B35' },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#fff' },
  info: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#666', marginLeft: 8, flex: 1 },
  acceptButton: { backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  acceptButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default OrderCard;


