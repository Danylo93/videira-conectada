import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ErrorText } from './style';

const CalendarInput = ({ control, name }) => {
  const [show, setShow] = useState(false);

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <Controller
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <Button
            onPress={showDatepicker}
            title={value ? new Date(value).toLocaleDateString() : "Selecione a Data"} // Convertendo a data para string
          />
          {show && (
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShow(Platform.OS === 'ios');
                onChange(selectedDate ? selectedDate.toISOString().split('T')[0] : null);
              }}
            />
          )}
          {error && <ErrorText>{error.message}</ErrorText>}
        </>
      )}
      name={name}
    />
  );
};

export default CalendarInput;
