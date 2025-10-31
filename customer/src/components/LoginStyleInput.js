import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const LoginStyleInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  style,
  showToggle = false, // For password visibility toggle
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showText, setShowText] = useState(!secureTextEntry); // For password visibility

  return (
    <View style={[styles.inputContainer, style]}>
      {icon && (
        <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !showText}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {showToggle && secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowText(!showText)}
        >
          <FontAwesome
            name={showText ? 'eye' : 'eye-slash'}
            size={18}
            color="#666"
          />
        </TouchableOpacity>
      )}
      {rightIcon && !showToggle && (
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={onRightIconPress}
        >
          <Ionicons
            name={rightIcon}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 0,
  },
  rightIcon: {
    padding: 4,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
});

export default LoginStyleInput;
