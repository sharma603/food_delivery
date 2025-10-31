import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Documents</Text></View>
      <View style={styles.section}>
        <View style={styles.row}><Ionicons name="document-text-outline" size={20} color="#FF6B35" /><Text style={styles.rowText}>Driving License</Text></View>
        <View style={styles.row}><Ionicons name="document-text-outline" size={20} color="#FF6B35" /><Text style={styles.rowText}>Vehicle Registration</Text></View>
        <View style={styles.row}><Ionicons name="document-text-outline" size={20} color="#FF6B35" /><Text style={styles.rowText}>Insurance</Text></View>
      </View>
      <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Upload Document</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowText: { marginLeft: 10, color: '#333', fontWeight: '600' },
  primaryButton: { margin: 16, backgroundColor: '#FF6B35', padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' }
});


