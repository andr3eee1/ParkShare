import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const PaymentMethodsScreen = () => {
  const navigation = useNavigation();
  const { user, token, updateUser } = useContext(AuthContext);

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addingCard, setAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await apiClient.get('/wallet/cards');
      setCards(res.data.cards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (cardNumber.length < 13 || expMonth.length !== 2 || expYear.length !== 2) {
      Alert.alert('Error', 'Please enter valid card details.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/wallet/cards', { cardNumber, expMonth, expYear });
      setAddingCard(false);
      setCardNumber('');
      setExpMonth('');
      setExpYear('');
      fetchCards();
      Alert.alert('Success', 'Card added successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add card';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async () => {
    try {
      const res = await apiClient.post('/wallet/deposit', { amount: 100 });
      await updateUser(res.data.user);
      Alert.alert('Top Up', 'Added 100 RON to wallet for demo purposes.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to top up wallet.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet & Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={24} color={tokens.colors.primaryText} style={{ marginRight: 8 }} />
                <Text style={styles.walletTitle}>ParkShare Balance</Text>
              </View>
            </View>
            <Text style={styles.walletAmount}>{(user?.walletBalance || 0).toFixed(2)} RON</Text>
            <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
              <Text style={styles.topUpText}>+ Top Up Wallet</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Saved Cards</Text>

          {loading ? (
            <ActivityIndicator color={tokens.colors.primaryText} />
          ) : (
            cards.map((card, idx) => (
              <View key={idx} style={styles.cardItem}>
                <Ionicons name="card-outline" size={24} color={tokens.colors.primaryText} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.cardBrand}>{card.brand} ending in {card.last4}</Text>
                  <Text style={styles.cardExpiry}>Expires {card.expMonth}/{card.expYear}</Text>
                </View>
                {card.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
            ))
          )}

          {!addingCard && (
            <TouchableOpacity style={styles.addCardButton} onPress={() => setAddingCard(true)}>
              <Ionicons name="add-circle-outline" size={20} color={tokens.colors.primaryText} />
              <Text style={styles.addCardText}>Add New Payment Method</Text>
            </TouchableOpacity>
          )}

          {addingCard && (
            <View style={styles.addCardForm}>
              <Text style={styles.formTitle}>New Credit Card</Text>
              
              <TextInput 
                style={styles.input} 
                placeholder="Card Number (16 digits)"
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={setCardNumber}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextInput 
                  style={[styles.input, { flex: 1, marginRight: 8 }]} 
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                  value={expMonth}
                  onChangeText={setExpMonth}
                />
                <TextInput 
                  style={[styles.input, { flex: 1, marginLeft: 8 }]} 
                  placeholder="YY"
                  keyboardType="numeric"
                  maxLength={2}
                  value={expYear}
                  onChangeText={setExpYear}
                />
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#F3F4F6', marginRight: 8 }]} onPress={() => setAddingCard(false)}>
                  <Text style={[styles.submitButtonText, { color: tokens.colors.primaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { marginLeft: 8 }]} onPress={handleAddCard} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitButtonText}>Save Card</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F5',
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
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  walletCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
  },
  walletTitle: {
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.secondaryText,
  },
  walletAmount: {
    fontFamily: tokens.typography.heading,
    fontSize: 36,
    color: tokens.colors.primaryText,
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  topUpText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  sectionTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    color: tokens.colors.primaryText,
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardBrand: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  cardExpiry: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
  },
  defaultBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addCardText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginLeft: 8,
  },
  addCardForm: {
    backgroundColor: tokens.colors.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  formTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: tokens.typography.body,
  },
  submitButton: {
    flex: 1,
    backgroundColor: tokens.colors.primaryText,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.white,
  },
});
