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
      // Landing / onboarding palette (constants/palette.ts mirrors these values).
      colors: {
        accent: "#c026a3", // berry (was the old brand red)
        "accent-dark": "#8a1673", // berryDark
        "red-pink": "#ff6f91", // strawberry
        "red-600-9": "rgba(192, 38, 163, 0.09)", // berry tint (was red)
        "red-600-45": "rgba(192, 38, 163, 0.45)",
        "red-pale": "#fbe3f4", // berry-pale; use accent-dark text on it
        "red-muted": "#c76fb5", // muted berry, decorative only
        "grey-700": "#4a2f3b",
        "modal-bg": "#ead8cc",
        "input-bg": "#ecdcd2",
        berry: "#c026a3",
        "berry-dark": "#8a1673",
        "berry-pale": "#fbe3f4",
        "berry-wash": "#fcf2f9", // selected rows, spot-reply bubbles, points pills (old red-50)
        espresso: "#3a1526",
        "espresso-light": "#5c2a3d",
        strawberry: "#ff6f91",
        pistachio: "#8bc34a",
        mango: "#ffb020",
        cream: "#fff8f0",
        "cream-soft": "#fff1e6",
        "cream-deep": "#ffe6d5",
        // Warm neutrals replacing Tailwind's cool gray scale (bg-gray-100,
        // border-gray-200, text-gray-500 … keep working, tinted towards espresso).
        // On white: 400 2.9:1 (decorative/placeholder only), 500 5.4:1,
        // 600 8.6:1, 700 11.9:1, 900 16:1.
        gray: {
          50: "#fff8f0", // cream: the loyalty screens use bg-gray-50 as their background
          100: "#f8f0ea", // berry text on it 4.6:1
          200: "#ead8cc",
          300: "#dcc8bc",
          400: "#a8929c",
          500: "#7a6470",
          600: "#5c4651",
          700: "#4a2f3b",
          800: "#42202f",
          900: "#3a1526",
        },
        text: {
          primary: "#3a1526", // espresso
          secondary: "#5c2a3d", // espressoLight
          tertiary: "#7a6470", // warm grey, 5.1:1 on cream
          subtitle: "#5c2a3d",
          "button-gray": "#4a2f3b",
        },
        background: {
          primary: "#FFFFFF",
          secondary: "#fff8f0", // cream (screen background)
          tertiary: "#fff1e6", // creamSoft
          gray: "#fff8f0", // cream (CustomSafeAreaView / TabScreenWrapper screens)
          grayDark: "#4a2f3b",
          lightGray: "#ead8cc",
          placeholder: "#ecdcd2",
        },
        brand: {
          primary: "#c026a3",
          logo: "#5c2a3d",
        },
        tabBar: {
          background: "#FFFFFF",
          border: "#f1e4dc",
        },
        button: {
          primary: "#c026a3",
          primaryDisabled: "#c026a380",
          secondary: "#fbe3f4", // berry-pale; pair with accent-dark text
          disabled: "#f8f0ea",
          border: "#ead8cc",
          placeholder: "#9a8590",
        },
        icon: {
          background: "#ecdcd2",
          placeholder: "#dcc8bc",
          tab: "#ead8cc",
          color: "#7a6470",
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
          light: "#f1e4dc",
          medium: "#ead8cc",
          dark: "#cdb5a8",
        },
        mainBg: "#fff8f0", // cream
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
        // Used across the app but never defined, so that text fell back to the
        // system font. iOS picks the Urbanist file by fontWeight (all files share
        // one family name), so each class sets both.
        ".font-urbanist-bold": { fontFamily: "Urbanist", fontWeight: "700" },
        ".font-urbanist-semibold": { fontFamily: "Urbanist-SemiBold", fontWeight: "600" },
      });
    },
  ],
};
