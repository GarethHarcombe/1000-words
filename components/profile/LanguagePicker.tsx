
import React from 'react';
import { useUserContext, Language } from '@/contexts/UserContext';

export const LanguagePicker = () => {
  const { language, setLanguage } = useUserContext();

  return (
    <label>
      Language:{' '}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        <option value="welsh">Welsh</option>
        <option value="spanish">Spanish</option>
      </select>
    </label>
  );
};
