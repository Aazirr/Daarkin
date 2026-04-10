/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm neutral backgrounds
        cream: "#FAF9F7",
        cardBg: "#FFFFFF",
        // Primary accent: Deep burgundy
        oxblood: "#4A0E0E",
        // Secondary accents
        slate: "#2C3E50",
        teal: "#1B8B8B",
        // Tertiary
        gold: "#C5A059",
        // Neutrals
        silverMist: "#E8E8E8",
        charcoal: "#1A1A1A",
        muted: "#6B7280",
      },
      boxShadow: {
        "sm-soft": "0 1px 2px rgba(0, 0, 0, 0.05)",
        "md-soft": "0 4px 6px rgba(0, 0, 0, 0.07)",
        "lg-soft": "0 10px 15px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
