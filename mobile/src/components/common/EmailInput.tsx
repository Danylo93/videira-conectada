// components/EmailInput.js

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmailInput = ({ value, onChangeText, placeholder, style }) => {
  const clearText = () => onChangeText('');

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="email-address"
        style={styles.input}
      />
      {value?.length > 0 && (
        <TouchableOpacity
          onPress={clearText}
          style={styles.iconButton}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor:'#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
  },
  iconButton: {
    paddingHorizontal: 10,
  },
});

export default EmailInput;
