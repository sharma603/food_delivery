import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface CashCollection {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    customer?: { name: string };
    restaurant?: { restaurantName: string };
    pricing?: { total: number };
  };
  amount: number;
  collectedAt: string;
  submissionStatus: 'pending' | 'submitted' | 'reconciled';
  submittedAt?: string;
  notes?: string;
}

interface CashSummary {
  cashInHand: number;
  pendingCashSubmission: number;
  totalCashCollected: number;
  totalCashSubmitted: number;
  pendingCollections: number;
  pendingCollectionsList: CashCollection[];
  submittedTodayCount: number;
  submittedTodayAmount: number;
}

export default function CashCollectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cashSummary, setCashSummary] = useState<CashSummary | null>({
    cashInHand: 0,
    pendingCashSubmission: 0,
    totalCashCollected: 0,
    totalCashSubmitted: 0,
    pendingCollections: 0,
    pendingCollectionsList: [],
    submittedTodayCount: 0,
    submittedTodayAmount: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositProof, setDepositProof] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCashData();
  }, []);

  const loadCashData = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getCashSummary();
      if (response.data.success) {
        setCashSummary(response.data.data);
      } else {
        // Initialize with default values if API fails
        setCashSummary({
          cashInHand: 0,
          pendingCashSubmission: 0,
          totalCashCollected: 0,
          totalCashSubmitted: 0,
          pendingCollections: 0,
          pendingCollectionsList: [],
          submittedTodayCount: 0,
          submittedTodayAmount: 0
        });
      }
    } catch (error: any) {
      console.error('Error loading cash data:', error);
      // Initialize with default values on error
      setCashSummary({
        cashInHand: 0,
        pendingCashSubmission: 0,
        totalCashCollected: 0,
        totalCashSubmitted: 0,
        pendingCollections: 0,
        pendingCollectionsList: [],
        submittedTodayCount: 0,
        submittedTodayAmount: 0
      });
      // Don't show alert for initial load, only for refresh
      if (!loading) {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to load cash data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadCashData();
  };

  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleSelectAll = () => {
    if (!cashSummary?.pendingCollectionsList) return;
    if (selectedCollections.length === cashSummary.pendingCollectionsList.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(cashSummary.pendingCollectionsList.map(c => c._id));
    }
  };

  const pickDepositProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to photos to upload deposit proof');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDepositProof(result.assets[0].uri);
    }
  };

  const handleSubmitCash = async () => {
    if (!cashSummary || cashSummary.cashInHand <= 0) {
      Alert.alert('No Cash', 'You have no cash to submit');
      return;
    }

    const amount = depositAmount ? parseFloat(depositAmount) : undefined;
    
    try {
      setSubmitting(true);
      const response = await deliveryAPI.submitCash(
        amount,
        selectedCollections.length > 0 ? selectedCollections : undefined,
        depositNotes,
        depositProof || undefined
      );
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          `Cash submitted successfully!\n\nSubmitted: Rs. ${response.data.data.submittedAmount.toFixed(2)}\nRemaining: Rs. ${response.data.data.remainingCashInHand.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowDepositModal(false);
                setDepositAmount('');
                setDepositNotes('');
                setDepositProof(null);
                setSelectedCollections([]);
                loadCashData();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit cash');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFE66D';
      case 'submitted': return '#FFD700';
      case 'reconciled': return '#4ECDC4';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'submitted': return 'Submitted';
      case 'reconciled': return 'Reconciled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cash Collection</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Collection</Text>
        <TouchableOpacity onPress={loadCashData}>
          <Ionicons name="refresh" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="cash" size={32} color="#FFD700" />
            <Text style={styles.summaryValue}>Rs. {(cashSummary?.cashInHand || 0).toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Cash in Hand</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="list" size={32} color="#FF6B35" />
            <Text style={styles.summaryValue}>{cashSummary?.pendingCollections || 0}</Text>
            <Text style={styles.summaryLabel}>Pending Deposits</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCardSmall}>
            <Text style={styles.summaryValueSmall}>Rs. {(cashSummary?.totalCashCollected || 0).toFixed(2)}</Text>
            <Text style={styles.summaryLabelSmall}>Total Collected</Text>
          </View>
          <View style={styles.summaryCardSmall}>
            <Text style={styles.summaryValueSmall}>Rs. {(cashSummary?.totalCashSubmitted || 0).toFixed(2)}</Text>
            <Text style={styles.summaryLabelSmall}>Total Submitted</Text>
          </View>
        </View>

        {/* Deposit Button */}
        {cashSummary && (cashSummary.cashInHand > 0 || cashSummary.pendingCollections > 0) && (
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => setShowDepositModal(true)}
          >
            <Ionicons name="wallet" size={20} color="#fff" />
            <Text style={styles.depositButtonText}>Deposit Cash</Text>
          </TouchableOpacity>
        )}

        {/* Pending Collections */}
        {cashSummary && cashSummary.pendingCollectionsList && cashSummary.pendingCollectionsList.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Collections</Text>
              <TouchableOpacity onPress={handleSelectAll}>
                <Text style={styles.selectAllText}>
                  {selectedCollections.length === cashSummary.pendingCollectionsList.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            {cashSummary.pendingCollectionsList.map((collection) => (
              <TouchableOpacity
                key={collection._id}
                style={[
                  styles.collectionCard,
                  selectedCollections.includes(collection._id) && styles.collectionCardSelected
                ]}
                onPress={() => handleSelectCollection(collection._id)}
              >
                <View style={styles.collectionHeader}>
                  <View style={styles.collectionInfo}>
                    <Text style={styles.collectionOrderId}>Order #{collection.order?.orderNumber || 'N/A'}</Text>
                    <Text style={styles.collectionAmount}>Rs. {collection.amount.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collection.submissionStatus) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(collection.submissionStatus)}</Text>
                  </View>
                </View>
                <View style={styles.collectionDetails}>
                  {collection.order?.customer && (
                    <Text style={styles.collectionDetailText}>
                      Customer: {collection.order.customer.name}
                    </Text>
                  )}
                  {collection.order?.restaurant && (
                    <Text style={styles.collectionDetailText}>
                      Restaurant: {collection.order.restaurant.restaurantName}
                    </Text>
                  )}
                  <Text style={styles.collectionDetailText}>
                    Collected: {formatDate(collection.collectedAt)}
                  </Text>
                  {collection.notes && (
                    <Text style={styles.collectionNotes}>{collection.notes}</Text>
                  )}
                </View>
                {selectedCollections.includes(collection._id) && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {cashSummary && cashSummary.cashInHand > 0 
                ? 'No pending cash collection records' 
                : 'No pending cash collections'}
            </Text>
            <Text style={styles.emptySubtext}>
              {cashSummary && cashSummary.cashInHand > 0 
                ? 'You may have cash in hand but no records. Please contact support.' 
                : 'All cash has been submitted'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} animationType="slide" transparent onRequestClose={() => setShowDepositModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Cash</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount to Deposit</Text>
                <TextInput
                  placeholder={`Rs. ${(cashSummary?.cashInHand || 0).toFixed(2)}`}
                  keyboardType="decimal-pad"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputHint}>
                  Available: Rs. {(cashSummary?.cashInHand || 0).toFixed(2)}
                </Text>
                {selectedCollections.length > 0 && (
                  <Text style={styles.inputHint}>
                    Selected {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  placeholder="Add any notes about the deposit..."
                  value={depositNotes}
                  onChangeText={setDepositNotes}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deposit Proof (Optional)</Text>
                <TouchableOpacity style={styles.proofButton} onPress={pickDepositProof}>
                  <Ionicons name="camera" size={20} color="#FF6B35" />
                  <Text style={styles.proofButtonText}>
                    {depositProof ? 'Change Photo' : 'Upload Photo'}
                  </Text>
                </TouchableOpacity>
                {depositProof && (
                  <Image source={{ uri: depositProof }} style={styles.proofImage} />
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitCash}
                disabled={submitting || !cashSummary || cashSummary.cashInHand <= 0}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Deposit'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValueSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabelSmall: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  collectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  collectionCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FDFA',
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionOrderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  collectionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  collectionDetails: {
    marginTop: 8,
  },
  collectionDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  collectionNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
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
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  proofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  proofButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

