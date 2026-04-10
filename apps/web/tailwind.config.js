/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cloudPearl: "#F5F5F7",
        oxblood: "#4A0E0E",
        gold: "#C5A059",
        silverMist: "#E2E2E2",
        charcoal: "#2C2C2C",
      },
    },
  },
  plugins: [],
};
