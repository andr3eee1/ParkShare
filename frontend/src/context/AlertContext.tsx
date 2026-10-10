import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AlertContext.styles';

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
