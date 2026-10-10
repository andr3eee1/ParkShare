import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { styles } from './PaymentMethodsScreen.styles';

export const PaymentMethodsScreen = () => {
  const { user, updateUser } = useContext(AuthContext);
  const { alert } = useAlert();

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
      alert('Error', 'Please enter valid card details.', undefined, 'error');
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
      alert('Success', 'Card added successfully', undefined, 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add card';
      alert('Error', errorMsg, undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async () => {
    try {
      const res = await apiClient.post('/wallet/deposit', { amount: 100 });
      await updateUser(res.data.user);
      alert('Top Up', 'Added 100 RON to wallet for demo purposes.', undefined, 'success');
    } catch (err) {
      console.error(err);
      alert('Error', 'Failed to top up wallet.', undefined, 'error');
    }
  };

  return (
    <Screen keyboardAvoiding>
      <ScreenHeader title="Wallet & Payment" subtitle="Balance and saved cards" />

      {/* Wallet card */}
      <GlassPanel style={styles.walletCard} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
        <View style={styles.walletHeader}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet-outline" size={20} color={tokens.colors.emerald} />
          </View>
          <Text style={styles.walletTitle}>ParkShare Balance</Text>
        </View>
        <Text style={styles.walletAmount}>{(user?.walletBalance || 0).toFixed(2)} RON</Text>
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color={tokens.colors.white} />
          <Text style={styles.topUpText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </GlassPanel>

      <Text style={styles.sectionTitle}>Saved Cards</Text>

      {loading ? (
        <ActivityIndicator color={tokens.colors.emerald} style={{ marginTop: 12 }} />
      ) : cards.length === 0 ? (
        <Text style={styles.emptyText}>No saved cards yet.</Text>
      ) : (
        cards.map((card, idx) => (
          <GlassPanel key={idx} style={styles.cardItem} borderRadius={16} intensity={40} overlayColor={tokens.colors.panelSurface}>
            <View style={styles.cardIcon}>
              <Ionicons name="card-outline" size={20} color={tokens.colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardBrand}>
                {card.brand} ending in {card.last4}
              </Text>
              <Text style={styles.cardExpiry}>
                Expires {card.expMonth}/{card.expYear}
              </Text>
            </View>
            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </GlassPanel>
        ))
      )}

      {!addingCard && (
        <TouchableOpacity style={styles.addCardButton} onPress={() => setAddingCard(true)} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={tokens.colors.primaryText} />
          <Text style={styles.addCardText}>Add New Payment Method</Text>
        </TouchableOpacity>
      )}

      {addingCard && (
        <GlassPanel style={styles.addCardForm} borderRadius={18} intensity={40} overlayColor={tokens.colors.panelSurface}>
          <Text style={styles.formTitle}>New Credit Card</Text>

          <TextInput
            style={styles.input}
            placeholder="Card Number (16 digits)"
            placeholderTextColor={tokens.colors.secondaryText}
            keyboardType="numeric"
            maxLength={19}
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="MM"
              placeholderTextColor={tokens.colors.secondaryText}
              keyboardType="numeric"
              maxLength={2}
              value={expMonth}
              onChangeText={setExpMonth}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="YY"
              placeholderTextColor={tokens.colors.secondaryText}
              keyboardType="numeric"
              maxLength={2}
              value={expYear}
              onChangeText={setExpYear}
            />
          </View>

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.submitButton, styles.cancelButton]}
              onPress={() => setAddingCard(false)}
            >
              <Text style={[styles.submitButtonText, { color: tokens.colors.primaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, { marginLeft: 8 }]} onPress={handleAddCard} disabled={submitting}>
              {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitButtonText}>Save Card</Text>}
            </TouchableOpacity>
          </View>
        </GlassPanel>
      )}
    </Screen>
  );
};
