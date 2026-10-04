import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export const AccountScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Personal Information', subtitle: 'Name, Email, Phone' },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage cards and billing' },
    { icon: 'car-outline', title: 'My Vehicles', subtitle: 'License plates and vehicle details' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Push and email preferences' },
    { icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password and 2FA settings' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQ and contact support' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Account</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role === 'PROVIDER' ? 'Parking Provider' : 'Verified User'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color={tokens.colors.primaryText} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tokens.colors.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>ParkShare App v1.0.0</Text>
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F5', // pale background
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  screenTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 32,
    color: tokens.colors.primaryText,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: tokens.colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  editButtonText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: tokens.typography.heading,
    fontSize: 24,
    color: tokens.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: tokens.typography.heading,
    fontSize: 20,
    color: tokens.colors.primaryText,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 118, 110, 0.1)', // pale green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.availabilityGreen,
  },
  menuContainer: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 13,
    color: tokens.colors.secondaryText,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: '#DC2626',
    marginLeft: 8,
  },
  versionText: {
    fontFamily: tokens.typography.body,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  }
});
