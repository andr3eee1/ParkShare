import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { apiClient } from '../../api/client';
import { styles } from './SecurityScreen.styles';

export const SecurityScreen = () => {
  const { user, updateUser } = useContext(AuthContext) as any;
  const { alert } = useAlert();

  // Email verification state
  const [emailCode, setEmailCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'enabling' | 'disabling'>('idle');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaMessage, setTwoFaMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // ------------------------------------------
  // Email Verification Handlers
  // ------------------------------------------
  const handleVerifyEmail = async () => {
    if (!emailCode || emailCode.length !== 6) {
      setEmailMessage({ text: 'Introdu codul de verificare de 6 cifre.', type: 'error' });
      return;
    }

    setVerifyingEmail(true);
    setEmailMessage(null);

    try {
      const res = await apiClient.post('/auth/verify-email', {
        email: user?.email,
        code: emailCode.trim(),
      });

      if (res.data.user) {
        await updateUser(res.data.user);
      } else {
        await updateUser({ ...user, emailVerified: true });
      }

      setEmailCode('');
      setEmailMessage({ text: 'Adresa de email a fost confirmată cu succes!', type: 'success' });
      alert('Succes', 'Adresa de email a fost verificată cu succes!', undefined, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Verificarea a eșuat.';
      setEmailMessage({ text: msg, type: 'error' });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setEmailMessage(null);

    try {
      await apiClient.post('/auth/resend-verification', {
        email: user?.email,
      });

      setEmailMessage({ text: 'Un nou cod de confirmare a fost trimis pe email.', type: 'success' });
      alert('Cod Trimis', `Am trimis un cod nou pe adresa ${user?.email}.`, undefined, 'info');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Nu s-a putut retrimite codul.';
      setEmailMessage({ text: msg, type: 'error' });
    } finally {
      setResendingEmail(false);
    }
  };

  // ------------------------------------------
  // 2FA Handlers
  // ------------------------------------------
  const handleStartEnable2FA = async () => {
    setTwoFaLoading(true);
    setTwoFaMessage(null);

    try {
      await apiClient.post('/auth/2fa/request-enable');
      setTwoFaStep('enabling');
      setTwoFaCode('');
      setTwoFaMessage({
        text: `Am trimis un cod de 6 cifre pe ${user?.email}. Introdu-l mai jos pentru a activa 2FA.`,
        type: 'success',
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Nu s-a putut iniția activarea 2FA.';
      setTwoFaMessage({ text: msg, type: 'error' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirmEnable2FA = async () => {
    if (!twoFaCode || twoFaCode.length !== 6) {
      setTwoFaMessage({ text: 'Introdu codul de 6 cifre primit pe email.', type: 'error' });
      return;
    }

    setTwoFaLoading(true);
    setTwoFaMessage(null);

    try {
      const res = await apiClient.post('/auth/2fa/confirm-enable', { code: twoFaCode.trim() });
      if (res.data.user) {
        await updateUser(res.data.user);
      } else {
        await updateUser({ ...user, twoFactorEnabled: true });
      }

      setTwoFaStep('idle');
      setTwoFaCode('');
      alert('2FA Activat', 'Autentificarea în doi pași este acum activă pe contul tău!', undefined, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Codul 2FA este invalid sau a expirat.';
      setTwoFaMessage({ text: msg, type: 'error' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirmDisable2FA = async () => {
    if (!twoFaPassword) {
      setTwoFaMessage({ text: 'Introdu parola contului pentru confirmare.', type: 'error' });
      return;
    }

    setTwoFaLoading(true);
    setTwoFaMessage(null);

    try {
      const res = await apiClient.post('/auth/2fa/disable', { password: twoFaPassword });
      if (res.data.user) {
        await updateUser(res.data.user);
      } else {
        await updateUser({ ...user, twoFactorEnabled: false });
      }

      setTwoFaStep('idle');
      setTwoFaPassword('');
      alert('2FA Dezactivat', 'Autentificarea în doi pași a fost dezactivată.', undefined, 'warning');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Parola este incorectă.';
      setTwoFaMessage({ text: msg, type: 'error' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ------------------------------------------
  // Password Change Handler
  // ------------------------------------------
  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ text: 'Introdu parola curentă.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Noua parolă trebuie să aibă cel puțin 6 caractere.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Noua parolă și confirmarea nu coincid.', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ text: 'Parola a fost schimbată cu succes! Un email de confirmare a fost trimis.', type: 'success' });
      alert('Succes', 'Parola ta a fost actualizată. Te rugăm să ții minte noua parolă.', undefined, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Schimbarea parolei a eșuat.';
      setPasswordMessage({ text: msg, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Securitate & Autentificare"
        subtitle="Protecție cont, 2FA și setări parolă"
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ========================================== */}
        {/* 1. Stare Email & Confirmare               */}
        {/* ========================================== */}
        <GlassPanel style={styles.card} borderRadius={20} intensity={30} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="mail-outline" size={22} color={tokens.colors.emerald} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Verificare Email</Text>
                <Text style={{ fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.slate }}>
                  {user?.email || 'email@exemplu.ro'}
                </Text>
              </View>
            </View>

            {user?.emailVerified ? (
              <View style={styles.badgeVerified}>
                <Ionicons name="checkmark-circle" size={14} color={tokens.colors.emeraldDeep} />
                <Text style={styles.badgeVerifiedText}>Confirmat</Text>
              </View>
            ) : (
              <View style={styles.badgeWarning}>
                <Ionicons name="alert-circle" size={14} color="#92400E" />
                <Text style={styles.badgeWarningText}>Neverificat</Text>
              </View>
            )}
          </View>

          {user?.emailVerified ? (
            <Text style={styles.cardSubtitle}>
              Adresa ta de email este confirmată și primește notificări securizate pentru rezervări și plăți.
            </Text>
          ) : (
            <View>
              <Text style={styles.cardSubtitle}>
                Contul tău nu este încă verificat. Introdu codul de 6 cifre primit la înregistrare pentru a confirma adresa.
              </Text>

              {emailMessage ? (
                <View style={emailMessage.type === 'error' ? styles.errorBox : styles.successBox}>
                  <Ionicons
                    name={emailMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                    size={16}
                    color={emailMessage.type === 'error' ? '#991B1B' : '#065F46'}
                  />
                  <Text style={emailMessage.type === 'error' ? styles.errorText : styles.successText}>
                    {emailMessage.text}
                  </Text>
                </View>
              ) : null}

              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor={tokens.colors.slate}
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleVerifyEmail}
                disabled={verifyingEmail}
              >
                {verifyingEmail ? (
                  <ActivityIndicator size="small" color={tokens.colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Confirmă Emailul</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={handleResendVerification}
                disabled={resendingEmail}
              >
                {resendingEmail ? (
                  <ActivityIndicator size="small" color={tokens.colors.emerald} />
                ) : (
                  <Text style={styles.outlineButtonText}>Retrimite Cod pe Email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </GlassPanel>

        {/* ========================================== */}
        {/* 2. Autentificare în Doi Pași (2FA)        */}
        {/* ========================================== */}
        <GlassPanel style={styles.card} borderRadius={20} intensity={30} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="shield-checkmark-outline" size={22} color={tokens.colors.emerald} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Autentificare 2FA</Text>
                <Text style={{ fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.slate }}>
                  Securitate suplimentară prin Email
                </Text>
              </View>
            </View>

            {user?.twoFactorEnabled ? (
              <View style={styles.badgeVerified}>
                <Ionicons name="shield-checkmark" size={14} color={tokens.colors.emeraldDeep} />
                <Text style={styles.badgeVerifiedText}>Activ</Text>
              </View>
            ) : (
              <View style={styles.badgeOff}>
                <Text style={styles.badgeOffText}>Inactiv</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardSubtitle}>
            La fiecare conectare, vei primi un cod de securitate de 6 cifre pe email pentru a garanta că doar tu ai acces la cont.
          </Text>

          {twoFaMessage ? (
            <View style={twoFaMessage.type === 'error' ? styles.errorBox : styles.successBox}>
              <Ionicons
                name={twoFaMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={twoFaMessage.type === 'error' ? '#991B1B' : '#065F46'}
              />
              <Text style={twoFaMessage.type === 'error' ? styles.errorText : styles.successText}>
                {twoFaMessage.text}
              </Text>
            </View>
          ) : null}

          {/* Stare implicită */}
          {twoFaStep === 'idle' ? (
            user?.twoFactorEnabled ? (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => {
                  setTwoFaStep('disabling');
                  setTwoFaPassword('');
                  setTwoFaMessage(null);
                }}
              >
                <Text style={styles.dangerButtonText}>Dezactivează 2FA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartEnable2FA}
                disabled={twoFaLoading}
              >
                {twoFaLoading ? (
                  <ActivityIndicator size="small" color={tokens.colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Activează Autentificarea 2FA</Text>
                )}
              </TouchableOpacity>
            )
          ) : null}

          {/* Pas Activare 2FA (introducere cod de 6 cifre primit pe email) */}
          {twoFaStep === 'enabling' ? (
            <View style={styles.actionBox}>
              <Text style={styles.actionBoxTitle}>Confirmă Activarea 2FA</Text>
              <Text style={styles.actionBoxDesc}>
                Introdu codul de securitate de 6 cifre trimis pe {user?.email}:
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor={tokens.colors.slate}
                value={twoFaCode}
                onChangeText={setTwoFaCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleConfirmEnable2FA}
                disabled={twoFaLoading}
              >
                {twoFaLoading ? (
                  <ActivityIndicator size="small" color={tokens.colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Verifică & Activează 2FA</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setTwoFaStep('idle');
                  setTwoFaMessage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Pas Dezactivare 2FA (confirmare prin parolă) */}
          {twoFaStep === 'disabling' ? (
            <View style={[styles.actionBox, styles.actionBoxDanger]}>
              <Text style={[styles.actionBoxTitle, styles.actionBoxTitleDanger]}>Confirmă Dezactivarea 2FA</Text>
              <Text style={styles.actionBoxDesc}>
                Pentru securitate, introdu parola contului pentru a dezactiva protecția în doi pași:
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: tokens.colors.white, marginBottom: 12 }]}
                placeholder="Parola ta curentă"
                placeholderTextColor={tokens.colors.slate}
                value={twoFaPassword}
                onChangeText={setTwoFaPassword}
                secureTextEntry
                autoFocus
              />

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleConfirmDisable2FA}
                disabled={twoFaLoading}
              >
                {twoFaLoading ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.dangerButtonText}>Confirmă Dezactivarea</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setTwoFaStep('idle');
                  setTwoFaMessage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </GlassPanel>

        {/* ========================================== */}
        {/* 3. Modificare Parolă                      */}
        {/* ========================================== */}
        <GlassPanel style={styles.card} borderRadius={20} intensity={30} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="lock-closed-outline" size={22} color={tokens.colors.emerald} />
              </View>
              <Text style={styles.cardTitle}>Schimbare Parolă</Text>
            </View>
          </View>

          <Text style={styles.cardSubtitle}>
            Alege o parolă sigură, formată din minimum 6 caractere, litere și cifre.
          </Text>

          {passwordMessage ? (
            <View style={passwordMessage.type === 'error' ? styles.errorBox : styles.successBox}>
              <Ionicons
                name={passwordMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={passwordMessage.type === 'error' ? '#991B1B' : '#065F46'}
              />
              <Text style={passwordMessage.type === 'error' ? styles.errorText : styles.successText}>
                {passwordMessage.text}
              </Text>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Parola Curentă</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="••••••••"
                placeholderTextColor={tokens.colors.slate}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={tokens.colors.slate}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Parola Nouă</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="Min. 6 caractere"
                placeholderTextColor={tokens.colors.slate}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={tokens.colors.slate}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirmă Parola Nouă</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="Repetă parola nouă"
                placeholderTextColor={tokens.colors.slate}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={tokens.colors.slate}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleChangePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <ActivityIndicator size="small" color={tokens.colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Actualizează Parola</Text>
            )}
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </Screen>
  );
};
