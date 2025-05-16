// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme");
const shadcnPreset = require("tailwindcss-preset-shadcn")();

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    // 1) container centralizado
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  presets: [shadcnPreset],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
