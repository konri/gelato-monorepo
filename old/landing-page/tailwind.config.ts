import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-urbanist)', 'sans-serif'],
      },
      inset: {
        'custom-right': 'calc(50% - 987px)',
      },
      colors: {
        'main-background-color': '#F5F5F5',
        'toggle-menu-background-color': '#EEEEEE',
        'main-orange-color': '#EC2828',
        'font-secondary-gray': '#748FB5',
        secondary: '#748FB5',
        'custom-gray': '#212121',
        'custom-gray-light': '#616161',
        brand: {
          primary: '#1A4196',
          logo: '#595666',
          accent: '#EC2828',
          'accent-dark': '#B01E1E',
        },
        green: {
          50: '#4CAF50',
          90: '#292C27',
        },
        gray: {
          10: '#EEEEEE',
          20: '#A2A2A2',
          30: '#7B7B7B',
          50: '#616161',
          90: '#212121',
        },
        orange: {
          1: '#E8520D',
        },
        blue: {
          70: '#1A4196',
        },
        yellow: {
          50: '#FEC601',
        },
      },
      fontSize: {
        'custom-48': '48px',
        'custom-36': '36px',
        'custom-32': '32px',
        'custom-24': '24px',
        'custom-13': '13px',
      },
      spacing: {
        'default-section-separator': '7rem',
        'default-subpages-section-separator': '4rem',
        'custom-pt-6': '1.5rem',
        'custom-pt-8': '2rem',
      },
      lineHeight: {
        average: '1.2',
      },
      screens: {
        xs: '400px',
        sm: '640px',
        '3xl': '1680px',
        '4xl': '2200px',
      },
      width: {
        'custom-500': '500px',
        'custom-240': '240px',
      },
      maxWidth: {
        '10xl': '1512px',
      },
      fontWeight: {
        'medium-semibold': '550',
      },
      borderRadius: {
        '5xl': '40px',
      },
      transitionDelay: {
        200: '200ms',
        400: '400ms',
        600: '600ms',
        800: '800ms',
        1000: '1000ms',
        1200: '1200ms',
      },
      transitionDuration: {
        800: '800ms',
      },
      backgroundImage: {
        'invite-gradient': 'linear-gradient(135.15deg, #AE80DC 1.17%, #DC83C3 31.88%, #8084DC 65.46%)',
      },
      blur: {
        '160': '160px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.filter-blur-160': {
          filter: 'blur(160px)',
        },
      });
    },
  ],
};

export default config;
