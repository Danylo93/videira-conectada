import React from 'react';
import { Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View, Text } from 'react-native';

const Select = ({ control, name, options, placeholder, isDisabled }) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <View style={styles.selectContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          enabled={!isDisabled}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={placeholder} value="" />
          {options.map(option => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
        {error && <Text style={styles.errorText}>{error.message}</Text>}
      </View>
    )}
  />
);

const styles = StyleSheet.create({
  selectContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
  },
  pickerItem: {
    height: 50,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});

export default Select;