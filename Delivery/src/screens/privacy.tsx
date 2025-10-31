import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function PrivacyScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@example.com');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('privacyPolicy')}</Text>
        <Text style={styles.headerSubtitle}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information that you provide directly to us, including:
          </Text>
          <Text style={styles.bullet}>• Personal information (name, email, phone number)</Text>
          <Text style={styles.bullet}>• Vehicle information (type, number, model)</Text>
          <Text style={styles.bullet}>• Location data (for delivery tracking)</Text>
          <Text style={styles.bullet}>• Order and transaction history</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <Text style={styles.bullet}>• Process and manage your deliveries</Text>
          <Text style={styles.bullet}>• Track your location for order assignments</Text>
          <Text style={styles.bullet}>• Calculate earnings and payments</Text>
          <Text style={styles.bullet}>• Communicate with you about orders</Text>
          <Text style={styles.bullet}>• Improve our services</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Location Services</Text>
          <Text style={styles.paragraph}>
            We collect your real-time location when you're online and delivering orders.
            This helps us assign nearby orders and track delivery progress.
            You can control location sharing in your device settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>You have the right to:</Text>
          <Text style={styles.bullet}>• Access your personal information</Text>
          <Text style={styles.bullet}>• Correct inaccurate data</Text>
          <Text style={styles.bullet}>• Request deletion of your account</Text>
          <Text style={styles.bullet}>• Opt-out of certain data collection</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, please contact us:
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={20} color="#FF6B35" />
            <Text style={styles.contactButtonText}>support@example.com</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
    marginLeft: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
});

