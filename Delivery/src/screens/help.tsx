import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('helpSupport')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:support@fooddelivery.com')}>
          <Ionicons name="mail-outline" size={20} color="#FF6B35" />
          <Text style={styles.rowText}>{t('emailSupport')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('tel:+977000000000')}>
          <Ionicons name="call-outline" size={20} color="#FF6B35" />
          <Text style={styles.rowText}>{t('callSupport')}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Ionicons name="information-circle-outline" size={20} color="#FF6B35" />
          <Text style={styles.rowText}>{t('faqComingSoon')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, 
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  backButton: {
    padding: 4,
  },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowText: { marginLeft: 10, color: '#333', fontWeight: '600' },
});


