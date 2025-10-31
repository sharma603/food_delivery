import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<Props> = ({ icon = 'search-outline', title, subtitle }) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color="#ccc" />
      <Text style={styles.emptyText}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtext}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default EmptyState;


