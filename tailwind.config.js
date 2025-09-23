/** @type {import('tailwindcss').Config} */
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        holi: {
          header: "#CBD8E0",
          nav: "#1B5071",
          btn: "#5285A5",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 2px 20px rgba(0,0,0,.07)",
        cardHover: "0 6px 30px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
}


