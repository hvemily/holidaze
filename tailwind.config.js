/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",   // 16px på mobil
        sm: "1.25rem",     // 20px
        lg: "2rem",        // 32px
        xl: "2.5rem",      // 40px
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1120px",   // vår maks-bredde for innhold (bevisst smalere for god leseopplevelse)
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        holi: { header: "#CBD8E0", nav: "#1B5071", btn: "#5285A5" },
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      boxShadow: {
        card: "0 2px 20px rgba(0,0,0,.07)",
        cardHover: "0 6px 30px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
}
