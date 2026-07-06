/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#EC2828',
          dark: '#C81E1E',
          light: '#FEF2F2',
        },
        espresso: {
          DEFAULT: '#4a044e',
          light: '#6b0670',
          dark: '#2d0230',
        },
        amber: {
          DEFAULT: '#b45309',
          light: '#d97706',
          dark: '#92400e',
        },
        canvas: {
          DEFAULT: '#fffdfa',
          light: '#ffffff',
          dark: '#f5f3f0',
        },
      },
    },
  },
  plugins: [],
}
