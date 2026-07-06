import React, { RefObject } from 'react';
import { View, TextInput } from 'react-native';

interface CodeInputProps {
  code: string[];
  inputRefs: RefObject<TextInput[]>;
  isLoading: boolean;
  onCodeChange: (value: string, index: number) => void;
  onKeyPress: (key: string, index: number) => void;
}

export const CodeInput = ({ code, inputRefs, isLoading, onCodeChange, onKeyPress }: CodeInputProps) => (
  <View className="flex-row justify-center space-x-3">
    {code.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => {
          if (ref && inputRefs.current) inputRefs.current[index] = ref;
        }}
        className={`w-12 h-12 rounded-full border-2 text-center text-xl font-bold ${
          digit ? 'border-red-500 bg-white' : 'border-gray-300 bg-white'
        }`}
        style={{ fontFamily: 'Urbanist', opacity: isLoading ? 0.5 : 1 }}
        value={digit}
        onChangeText={(value) => onCodeChange(value, index)}
        onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, index)}
        keyboardType="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        selectTextOnFocus
        editable={!isLoading}
      />
    ))}
  </View>
);
