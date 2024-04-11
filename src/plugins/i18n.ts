import i18next from 'i18next';
import { menu as enMenu } from '../locales/en/menu';

export const menuNS = 'menu';

i18next.init({
  lng: 'en', // Default language
  fallbackLng: 'en', // Fallback language
  debug: true, // Enable debug mode (optional)
  resources: {
    en: {
      menu: enMenu,
    },
  },
});

export default i18next;