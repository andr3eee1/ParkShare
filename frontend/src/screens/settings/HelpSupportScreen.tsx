import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

export const HelpSupportScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={28} color={tokens.colors.primaryText} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Email Support</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:tibi.enache2010@gmail.com')}>
              <Text style={styles.valueText}>tibi.enache2010@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="call-outline" size={28} color={tokens.colors.primaryText} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Phone Support</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:0770240139')}>
              <Text style={styles.valueText}>0770 240 139</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.footerText}>We are available Monday to Friday, 9:00 AM - 5:00 PM.</Text>

      </ScrollView>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
    marginBottom: 4,
  },
  valueText: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  footerText: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
    textAlign: 'center',
    marginTop: 24,
  }
});