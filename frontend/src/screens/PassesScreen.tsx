import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPanel } from '../components/GlassPanel';
import { PASS_CATALOG, ParkingPass, usePasses } from '../context/PassContext';
import { tokens } from '../theme/tokens';
import { styles } from './PassesScreen.styles';

export const PassesScreen = () => {
  const { activePasses } = usePasses();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Passes</Text>
            <Text style={styles.subtitle}>Park more simply, every month</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="card-outline" size={22} color={tokens.colors.primaryText} />
          </View>
        </View>

        <GlassPanel style={styles.hero} borderRadius={22} intensity={45} overlayColor="transparent">
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles-outline" size={24} color={tokens.colors.white} />
          </View>
          <Text style={styles.heroTitle}>Your parking, on your terms</Text>
          <Text style={styles.heroText}>Choose a dedicated spot pass or unlock premium savings across Bucharest with Park Plus.</Text>
          <View style={styles.heroPerks}>
            <HeroPerk icon="shield-checkmark-outline" text="Zero deposit" />
            <HeroPerk icon="flash-outline" text="Instant check-in" />
          </View>
        </GlassPanel>

        {activePasses.length > 0 && (
          <View style={styles.activeBanner}>
            <Ionicons name="checkmark-circle" size={20} color={tokens.colors.availabilityGreen} />
            <Text style={styles.activeBannerText}>{activePasses.length} active {activePasses.length === 1 ? 'pass' : 'passes'} · benefits apply at checkout</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choose your pass</Text>
        {PASS_CATALOG.map((pass) => <PassCard key={pass.id} pass={pass} />)}

        <Text style={styles.note}>Pass activation is a mock experience for this demo. No payment is processed.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const HeroPerk = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.heroPerk}>
    <Ionicons name={icon} size={16} color={tokens.colors.availabilityGreen} />
    <Text style={styles.heroPerkText}>{text}</Text>
  </View>
);

const PassCard = ({ pass }: { pass: ParkingPass }) => {
  const { isPassActive, togglePass } = usePasses();
  const navigation = useNavigation<any>();
  const isActive = isPassActive(pass.id);

  return (
    <GlassPanel style={styles.passCard} borderRadius={20} intensity={35} overlayColor={tokens.colors.panelSurface}>
      <View style={styles.passHeader}>
        <View style={[styles.passIcon, { backgroundColor: `${pass.accent}18` }]}>
          <Ionicons name={pass.icon} size={22} color={pass.accent} />
        </View>
        <View style={styles.passHeading}>
          <Text style={styles.passName}>{pass.name}</Text>
          <Text style={styles.passDescription}>{pass.description}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{pass.price}</Text>
          <Text style={styles.priceUnit}>{pass.billingLabel}</Text>
        </View>
      </View>

      {pass.targetSpotLabel && (
        <View style={styles.spotBox}>
          <Ionicons name="location-outline" size={17} color={pass.accent} />
          <View style={styles.spotCopy}>
            <Text style={styles.spotLabel}>Dedicated spot</Text>
            <Text style={styles.spotName}>{pass.targetSpotLabel}</Text>
            <Text style={styles.schedule}>{pass.schedule}</Text>
          </View>
        </View>
      )}

      <View style={styles.perks}>
        {pass.perks.map((perk) => (
          <View style={styles.perk} key={perk}>
            <Ionicons name="checkmark" size={14} color={tokens.colors.availabilityGreen} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        onPress={() => {
          if (isActive) {
            togglePass(pass.id); // Cancel it directly
          } else {
            (navigation as any).navigate('PaymentCheckout', {
              amount: pass.price,
              title: pass.name,
              actionType: 'PASS',
              targetId: pass.id
            });
          }
        }}
        style={[styles.actionButton, isActive && styles.actionButtonActive]}
      >
        <Ionicons name={isActive ? 'checkmark-circle-outline' : 'add-circle-outline'} size={18} color={isActive ? tokens.colors.availabilityGreen : tokens.colors.white} />
        <Text style={[styles.actionText, isActive && styles.actionTextActive]}>{isActive ? 'Active · Manage pass' : 'Activate pass'}</Text>
      </TouchableOpacity>
    </GlassPanel>
  );
};
