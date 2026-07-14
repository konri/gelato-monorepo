'use client';

import { useState } from 'react';
import AnimatedText from '@/components/common/AnimatedText';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import Button from '@/components/common/Button';

type ContactFormProps = {
  locale: Locale;
};

const ContactForm = ({ locale }: ContactFormProps) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { t } = getTranslation('contact', locale);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Message:', message);
  };

  return (
    <div className="mx-auto mt-10 w-full min-w-0 max-w-full">
      <AnimatedText text1={t('title1')} text2="" text3="" />
      <p className="mb-6 text-gray-500">{t('subtitle1')}</p>
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label className="mb-2 block text-sm text-gray-600">{t('emailField1')}</label>
          <input
            type="email"
            className="w-full max-w-full rounded-lg border border-gray-300 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={t('emailField1Placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-600">{t('emailField2')}</label>
          <textarea
            className="h-36 w-full resize-none rounded-lg border border-gray-300 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={t('emailField2Placeholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
        </div>
        <Button type="button" title={t('emailButtonText')} variant="btn_orange_home_page_mobile" paddingX="px-4" />
      </form>
    </div>
  );
};

export default ContactForm;
