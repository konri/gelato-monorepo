/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./atoms/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: "#EC2828",
        "accent-dark": "#B01E1E",
        "red-pink": "#f91f3f",
        "red-600-9": "rgba(236, 40, 40, 0.09)",
        "red-600-45": "rgba(236, 40, 40, 0.45)",
        "red-pale": "#FFCCCC",
        "red-muted": "#CC6666",
        "grey-700": "#4A4A4A",
        "modal-bg": "#D7D7D7",
        "input-bg": "#A9A9A9",
        text: {
          primary: "#212121",
          secondary: "#616161",
          tertiary: "#9E9E9E",
          subtitle: "#616161",
          "button-gray": "#404040",
        },
        background: {
          primary: "#FFFFFF",
          secondary: "#F5F5F5",
          tertiary: "#EEEEEE",
          gray: "#F3F3F3",
          grayDark: "#374151",
          lightGray: "#D9D9D9",
          placeholder: "#DBDBDB",
        },
        brand: {
          primary: "#1A4196",
          logo: "#595666",
        },
        tabBar: {
          background: "#FFFFFF",
          border: "#E5E5E5",
        },
        button: {
          primary: "#EC2828",
          primaryDisabled: "#EC282880",
          secondary: "#748FB54D",
          disabled: "#F3F3F3",
          border: "#E0E0E0",
          placeholder: "#9E9E9E",
        },
        icon: {
          background: "#DFDFDF",
          placeholder: "#C1C1C1",
          tab: "#D9D9D9",
          color: "#9E9E9E",
        },
        status: {
          success: "#4CAF50",
          warning: "#FF9800",
          error: "#F44336",
          info: "#2196F3",
        },
        triangle: {
          up: "#4EB02B",
          down: "#B02B2B",
        },
        border: {
          light: "#EEEEEE",
          medium: "#E0E0E0",
          dark: "#BDBDBD",
        },
        mainBg: "#F2F2F2",
        user: {
          primary: "#2D67BE",
        },
      },
      fontFamily: {
        urbanist: ["Urbanist", "sans-serif"],
        "urbanist-light": ["Urbanist-Light", "sans-serif"],
      },
      lineHeight: {
        22.4: "22.4px",
        28.8: "28.8px",
        51.2: "51.2px",
        "initials": "30px",
        "badge": "16px",
      },
      letterSpacing: {
        0.2: "0.2px",
      },
      borderRadius: {
        "24px": "24px",
        "32px": "32px",
        button: "32px",
        "full-pill": "1000px",
      },
      fontSize: {
        subtitle: "18px",
        "32px": "32px",
        initials: "19px",
        badge: "10px",
      },
      width: {
        88: "352px",
        37: "148px",
        30: "120px",
        "size-37": "37px",
        "size-38": "38px",
        "size-14": "14px",
      },
      height: {
        88: "352px",
        36: "144px",
        14.5: "58px",
        30: "120px",
        15: "61px",
        "accent-pill": "35px",
        "accent-pill-sm": "28px",
        "size-37": "37px",
        "size-39": "39px",
        "size-14": "14px",
      },
      spacing: {
        18: "72px",
        8: "32px",
        9: "36px",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".shadow-sm": {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        ".shadow-md": {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        },
      });
    },
  ],
};
