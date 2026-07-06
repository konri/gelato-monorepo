import { useState } from 'react';

export const useSecureAccount = () => {
  const [countryCode, setCountryCode] = useState('+1');

  return {
    countryCode,
    setCountryCode,
  };
};
