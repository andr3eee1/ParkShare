import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Ionicons } from '@expo/vector-icons';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
};

type AlertContextType = {
  alert: (title: string, message?: string, buttons?: AlertButton[], type?: AlertOptions['type']) => void;
};

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const alert = (title: string, message?: string, buttons?: AlertButton[], type: AlertOptions['type'] = 'info') => {
    setOptions({ title, message, buttons, type });
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setTimeout(() => setOptions(null), 300); // Wait for fade out
  };

  const renderIcon = () => {
    if (!options?.type) return null;
    let iconName = 'information-circle';
    let color = tokens.colors.municipalTeal;
    switch (options.type) {
      case 'success':
        iconName = 'checkmark-circle';
        color = tokens.colors.availabilityGreen;
        break;
      case 'warning':
        iconName = 'warning';
        color = tokens.colors.warningAmber;
        break;
      case 'error':
        iconName = 'close-circle';
        color = tokens.colors.danger;
        break;
    }
    return (
      <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
        <Ionicons name={iconName as any} size={28} color={color} />
      </View>
    );
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      {visible && options && (
        <Modal transparent visible={visible} animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.alertBox}>
              <GlassPanel borderRadius={16} style={{ padding: 24, width: '100%', maxWidth: 360, alignSelf: 'center' }}>
                <View style={styles.content}>
                  {renderIcon()}
                  <Text style={styles.title}>{options.title}</Text>
                  {options.message && <Text style={styles.message}>{options.message}</Text>}
                </View>
                <View style={styles.buttonContainer}>
                  {(options.buttons || [{ text: 'OK' }]).map((btn, index) => {
                    const isDestructive = btn.style === 'destructive';
                    const isCancel = btn.style === 'cancel';
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          isDestructive && styles.buttonDestructive,
                          isCancel && styles.buttonCancel,
                          options.buttons && options.buttons.length === 2 && { flex: 1, marginHorizontal: 4 }
                        ]}
                        onPress={() => {
                          close();
                          if (btn.onPress) btn.onPress();
                        }}
                      >
                        <Text style={[
                          styles.buttonText,
                          isDestructive && styles.buttonTextDestructive,
                          isCancel && styles.buttonTextCancel
                        ]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </GlassPanel>
            </View>
          </View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 20,
    color: tokens.colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: tokens.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: tokens.colors.emerald,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: tokens.radii.inputControl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonDestructive: {
    backgroundColor: tokens.colors.danger,
  },
  buttonCancel: {
    backgroundColor: '#EEF2F5',
  },
  buttonText: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 16,
    color: tokens.colors.white,
  },
  buttonTextDestructive: {
    color: tokens.colors.white,
  },
  buttonTextCancel: {
    color: tokens.colors.primaryText,
  },
});
