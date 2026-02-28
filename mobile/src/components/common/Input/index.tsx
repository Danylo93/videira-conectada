import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { StyledInput, ErrorText } from './style';

const Input = ({ control, name, placeholder, keyboardType, secureTextEntry, editable = true }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <>
          <StyledInput
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            onBlur={() => { onBlur(); setIsFocused(false); }}
            onFocus={() => setIsFocused(true)}
            onChangeText={onChange}
            value={value}
            isFocused={isFocused}
            editable={editable} // Passa a propriedade editable para StyledInput
          />
          {error && <ErrorText>{error.message}</ErrorText>}
        </>
      )}
      name={name}
      rules={{ required: `${placeholder} is required` }} // Adicione regras de validação conforme necessário
    />
  );
};

export default Input;
