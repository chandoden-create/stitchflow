import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  style?: any;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  style,
  isPassword = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const effectiveSecure = isPassword ? !showPassword : props.secureTextEntry;
  const effectiveRightIcon = isPassword
    ? (showPassword ? 'eye-off-outline' : 'eye-outline')
    : rightIcon;
  const effectiveRightPress = isPassword
    ? () => setShowPassword((v) => !v)
    : onRightIconPress;

  const isEditable = props.editable !== false;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => {
          if (isEditable && inputRef.current) {
            inputRef.current.focus();
          }
        }}
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error ? styles.hasError : undefined,
          !isEditable && styles.disabledContainer,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={isFocused ? Colors.primary : Colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            props.multiline && styles.multilineInput,
            style,
            inputStyle,
          ]}
          placeholderTextColor={Colors.placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={effectiveSecure}
          {...props}
        />
        {effectiveRightIcon && (
          <TouchableOpacity onPress={effectiveRightPress} style={styles.rightIcon}>
            <Ionicons
              name={effectiveRightIcon}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(201, 169, 110, 0.35)',
    minHeight: 52,
    paddingHorizontal: Spacing[4],
  },
  focused: {
    borderColor: '#6B2D3E',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6B2D3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledContainer: {
    backgroundColor: '#F3EFEA',
    opacity: 0.75,
  },
  hasError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Spacing[3],
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: Spacing[2],
  },
  rightIcon: {
    padding: Spacing[1],
    marginLeft: Spacing[2],
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing[1],
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },
});
