import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useController, Control } from 'react-hook-form';
import { tokens } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

interface FormInputProps extends TextInputProps {
  name: string;
  control: any;
  label: string;
  helperText?: string;
  disabled?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  name, control, label, helperText, disabled, ...textInputProps 
}) => {
  const { field, fieldState } = useController({ name, control });
  const [focused, setFocused] = useState(false);
  const { onFocus, onBlur, ...rest } = textInputProps;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          fieldState.error && styles.inputError,
          disabled && styles.disabledInput
        ]}
        value={field.value}
        onChangeText={field.onChange}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); field.onBlur(); onBlur?.(e); }}
        editable={!disabled}
        placeholderTextColor={tokens.colors.secondaryText}
        {...rest}
      />
      {fieldState.error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={14} color="#991B1B" />
          <Text style={styles.errorText}>{fieldState.error.message}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    marginBottom: 8,
    color: tokens.colors.primaryText,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  inputFocused: {
    borderColor: tokens.colors.emerald,
    backgroundColor: tokens.colors.emeraldWash,
  },
  inputError: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: tokens.colors.secondaryText,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: '#991B1B',
    marginLeft: 4,
  },
  helperText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginTop: 6,
  }
});
