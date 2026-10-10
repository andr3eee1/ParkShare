import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useContext, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Screen } from '../components/Screen';
import { BrandGradient } from '../components/Brand';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Good standing', color: tokens.colors.availabilityGreen, bg: tokens.colors.emeraldTint },
  WARNING: { label: 'Warning', color: tokens.colors.warningAmber, bg: '#FEF3C7' },
  SUSPENDED: { label: 'Suspended', color: tokens.colors.warningAmber, bg: '#FEF3C7' },
  BANNED: { label: 'Banned', color: tokens.colors.danger, bg: '#FDECEC' },
};

export const AccountScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout, token, updateUser } = useContext(AuthContext) as any;
  const isAdmin = user?.role === 'ADMIN';
  const status = STATUS_STYLE[user?.accountStatus || 'ACTIVE'] || STATUS_STYLE.ACTIVE;

  // Refresh standing whenever the tab is focused so warnings appear promptly.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      apiClient
        .get('/auth/me')
        .then((res) => { if (active && res.data?.user) updateUser(res.data.user); })
        .catch(() => {});
      return () => { active = false; };
    }, [token])
  );

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    ...(isAdmin ? [{ icon: 'shield-checkmark-outline', title: 'Admin Panel', subtitle: 'Manage the ParkShare marketplace', route: 'AdminDashboard' }] : []),
    { icon: 'shield-half-outline', title: 'Trust & Safety', subtitle: 'Rating, standing, and appeals', route: 'Standing' },
    { icon: 'person-outline', title: 'Personal Information', subtitle: 'Name, Email, Phone', route: 'PersonalInformation' },
    { icon: 'card-outline', title: 'Wallet', subtitle: 'Manage balance and cards', route: 'PaymentMethods' },
    { icon: 'car-outline', title: 'My Vehicles', subtitle: 'License plates and vehicle details', route: 'MyVehicles' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Push and email preferences', route: 'Notifications' },
    { icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password and 2FA settings', route: 'Security' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQ and contact support', route: 'HelpSupport' },
  ];

  return (
    <Screen>
      {/* Profile hero */}
      <BrandGradient style={styles.hero}>
        <View pointerEvents="none" style={styles.heroSheen} />
        <View style={styles.heroTopRow}>
          <Text style={styles.heroEyebrow}>ACCOUNT</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('PersonalInformation')} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={15} color={tokens.colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroProfile}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{isAdmin ? 'Platform Administrator' : user?.role === 'PROVIDER' ? 'Parking Provider' : 'Verified User'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Standing')} style={styles.heroStatusPill} activeOpacity={0.85}>
          <Ionicons name="star" size={12} color={status.color} />
          <Text style={[styles.heroStatusText, { color: status.color }]}>{status.label}</Text>
          <Ionicons name="chevron-forward" size={13} color={status.color} />
        </TouchableOpacity>
      </BrandGradient>

      {user?.accountStatus && user.accountStatus !== 'ACTIVE' && (
        <TouchableOpacity
          style={[styles.standingBanner, { backgroundColor: status.bg, borderColor: status.color }]}
          onPress={() => navigation.navigate('Standing')}
          activeOpacity={0.85}
        >
          <Ionicons name="warning-outline" size={20} color={status.color} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.standingBannerTitle, { color: status.color }]}>Account {status.label.toLowerCase()}</Text>
            <Text style={styles.standingBannerText}>Tap to view details and submit an appeal.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={status.color} />
        </TouchableOpacity>
      )}

      {/* Menu Items */}
      <GlassPanel style={styles.menuContainer} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index < menuItems.length - 1 ? styles.menuDivider : null]}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={20} color={tokens.colors.emerald} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.colors.secondaryText} />
          </TouchableOpacity>
        ))}
      </GlassPanel>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={22} color={tokens.colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.brandFooter}>
        <Image source={require('../../assets/logo-mark.png')} style={styles.brandMark} />
        <Text style={styles.versionText}>ParkShare App v1.0.0</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    borderRadius: tokens.radii.upperSheet,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 20,
    ...tokens.shadows.soft,
  },
  heroSheen: {
    position: 'absolute',
    right: -60,
    top: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroEyebrow: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: tokens.radii.pill,
  },
  editButtonText: { fontFamily: tokens.typography.bodySemiBold, color: tokens.colors.white, fontSize: 13, marginLeft: 5 },
  heroProfile: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontFamily: tokens.typography.headingBold, fontSize: 24, color: tokens.colors.emeraldDeep },
  avatarImage: { width: '100%', height: '100%', borderRadius: 32 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: tokens.typography.headingBold, fontSize: 22, color: tokens.colors.white, marginBottom: 2 },
  profileEmail: { fontFamily: tokens.typography.body, fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 8 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  roleText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 11, color: tokens.colors.white },
  heroStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radii.pill,
    marginTop: 16,
  },
  heroStatusText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 12, marginLeft: 5, marginRight: 3 },
  standingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  standingBannerTitle: { fontFamily: tokens.typography.bodySemiBold, fontSize: 14 },
  standingBannerText: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText, marginTop: 2 },
  menuContainer: { paddingHorizontal: 4, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: '#EDF1EF' },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: tokens.colors.emeraldTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontFamily: tokens.typography.bodySemiBold, fontSize: 15, color: tokens.colors.primaryText, marginBottom: 2 },
  menuSubtitle: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  logoutText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 15, color: tokens.colors.danger, marginLeft: 8 },
  versionText: { fontFamily: tokens.typography.body, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 4,
  },
  brandMark: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
});
