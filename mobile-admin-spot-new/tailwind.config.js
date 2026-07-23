module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        espresso: '#4a044e',
        amber: '#b45309',
        canvas: '#fffdfa',
      },
    },
  },
};
