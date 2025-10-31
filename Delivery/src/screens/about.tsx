import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>About</Text></View>
      <View style={styles.section}>
        <Text style={styles.text}>Food Delivery Partner App</Text>
        <Text style={styles.text}>Version 1.0.0</Text>
        <Text style={styles.text}>Made with ❤️ to help you deliver faster.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12 },
  text: { fontSize: 14, color: '#333', marginBottom: 6 },
});


