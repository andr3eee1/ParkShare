import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useController, Control } from 'react-hook-form';
import { tokens } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './FormInput.styles';

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
