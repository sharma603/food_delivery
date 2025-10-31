import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<Array<{ id: string; brand: string; last4: string }>>([]);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Payment Methods</Text></View>
      <FlatList
        data={methods}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <View style={styles.empty}> 
            <Ionicons name="card-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No payment methods added</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Ionicons name="card-outline" size={20} color="#FF6B35" />
            <Text style={styles.cardText}>{`${item.brand} •••• ${item.last4}`}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Add Payment Method</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  empty: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', marginTop: 8 },
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  cardText: { marginLeft: 8, color: '#333', fontWeight: '600' },
  primaryButton: { margin: 16, backgroundColor: '#FF6B35', padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' }
});


