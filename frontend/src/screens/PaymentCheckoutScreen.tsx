import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { usePasses } from '../context/PassContext';
import { apiClient } from '../api/client';
import { SlideUpView } from '../components/SlideUpView';
import { useAlert } from '../context/AlertContext';

export const PaymentCheckoutScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { title, amount, targetId, actionType, startTime, endTime } = route.params as any;

  const { user, token, updateUser } = useContext(AuthContext);
  const { togglePass } = usePasses();
  const { alert } = useAlert();
  
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'card'>('wallet');
  const [processing, setProcessing] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const walletBalance = user?.walletBalance || 0;
  const canAfford = walletBalance >= amount;

  const handleTopUp = async () => {
    setTopUpLoading(true);
    try {
      const res = await apiClient.post('/wallet/deposit', { amount: 100 });
      await updateUser(res.data.user);
      alert('Top Up Successful', 'Added 100.00 RON to your wallet.', undefined, 'success');
    } catch (err) {
      alert('Error', 'Failed to top up wallet.', undefined, 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handlePayment = async () => {
    if (selectedMethod === 'wallet' && !canAfford) {
      alert('Insufficient Balance', 'Please top up your wallet or select a different payment method.', undefined, 'warning');
      return;
    }

    setProcessing(true);
    try {
      if (selectedMethod === 'card') {
        // Mock credit card payment delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Execute Action
      if (actionType === 'PASS') {
        if (selectedMethod === 'wallet') {
          const res = await apiClient.post('/wallet/pay', { amount });
          await updateUser(res.data.user);
        }
        await togglePass(targetId);
      } else if (actionType === 'BOOKING') {
        await apiClient.post('/bookings', {
          spotId: targetId,
          startTime,
          securityDeposit: amount,
          paymentMethod: selectedMethod === 'wallet' ? 'wallet' : 'card'
        });
        
        if (selectedMethod === 'wallet' && user) {
          updateUser({ ...user, walletBalance: (user.walletBalance || 0) - amount });
        }
      }

      setPaymentSuccess(true);

    } catch (err: any) {
      let errorMsg = err.message;
      if (err.response?.data?.error) {
        errorMsg = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : JSON.stringify(err.response.data.error);
      }
      alert('Payment Error', errorMsg, undefined, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.overlay}>
      {paymentSuccess ? (
        <View style={styles.successOverlay}>
          <View style={styles.successModal}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark" size={48} color="#059669" />
            </View>
            <Text style={{ fontFamily: tokens.typography.heading, fontSize: 24, color: tokens.colors.primaryText, textAlign: 'center' }}>
              Payment Successful!
            </Text>
            <Text style={{ fontFamily: tokens.typography.body, fontSize: 16, color: tokens.colors.secondaryText, marginTop: 12, textAlign: 'center', marginBottom: 24 }}>
              You successfully paid {amount.toFixed(2)} RON.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} disabled={processing} />
          <SlideUpView style={styles.sheetContainer} draggable={true} minimizedOffset={600} initialMinimized={false}>
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={processing}>
                  <Ionicons name="close" size={24} color={tokens.colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.content}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>{title}</Text>
                  <Text style={styles.summaryAmount}>{amount.toFixed(2)} RON</Text>
                </View>

                <Text style={styles.sectionTitle}>Payment Method</Text>

                <TouchableOpacity 
                  style={[styles.methodCard, selectedMethod === 'wallet' && styles.methodCardSelected]}
                  onPress={() => setSelectedMethod('wallet')}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons name="wallet-outline" size={24} color={tokens.colors.primaryText} />
                  </View>
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodName}>ParkShare Wallet</Text>
                    <Text style={styles.methodSub}>Balance: {walletBalance.toFixed(2)} RON</Text>
                  </View>
                  {selectedMethod === 'wallet' && <Ionicons name="checkmark-circle" size={24} color={tokens.colors.municipalTeal} />}
                </TouchableOpacity>

                {!canAfford && selectedMethod === 'wallet' && (
                  <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp} disabled={topUpLoading}>
                    {topUpLoading ? <ActivityIndicator size="small" color={tokens.colors.white} /> : <Text style={styles.topUpButtonText}>Top Up +100 RON</Text>}
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardSelected]}
                  onPress={() => setSelectedMethod('card')}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons name="card-outline" size={24} color={tokens.colors.primaryText} />
                  </View>
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodName}>Visa ending in 4242</Text>
                    <Text style={styles.methodSub}>Expires 12/28</Text>
                  </View>
                  {selectedMethod === 'card' && <Ionicons name="checkmark-circle" size={24} color={tokens.colors.municipalTeal} />}
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity 
                  style={[styles.payButton, (selectedMethod === 'wallet' && !canAfford) && styles.payButtonDisabled]} 
                  onPress={handlePayment} 
                  disabled={processing || (selectedMethod === 'wallet' && !canAfford)}
                >
                  {processing ? (
                    <ActivityIndicator color={tokens.colors.white} />
                  ) : (
                    <Text style={styles.payButtonText}>Pay {amount.toFixed(2)} RON</Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </SlideUpView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },
  successOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  successModal: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    backgroundColor: tokens.colors.primaryText,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.heading,
    fontSize: 18,
  },
  sheetContainer: {
    backgroundColor: '#EEF2F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    color: tokens.colors.primaryText,
  },
  content: {
    flex: 1,
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: tokens.colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: {
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.secondaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryAmount: {
    fontFamily: tokens.typography.heading,
    fontSize: 32,
    color: tokens.colors.primaryText,
  },
  sectionTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    color: tokens.colors.primaryText,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: tokens.colors.municipalTeal,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  methodSub: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
    marginTop: 2,
  },
  topUpButton: {
    backgroundColor: tokens.colors.primaryText,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: 64,
  },
  topUpButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.body,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: tokens.colors.primaryText,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.heading,
    fontSize: 18,
  },
});
