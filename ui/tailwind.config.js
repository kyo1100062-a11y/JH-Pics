/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4C6FFF',
        'deep-blue': '#10131A',
        'soft-blue': '#A8B7F5',
        'accent-mint': '#AEEAFF',
      },
      fontFamily: {
        suit: ['SUIT', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'button': '12px',
        'button-lg': '16px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(76, 111, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(76, 111, 255, 0.4)',
        'glow-primary': '0 0 30px rgba(76, 111, 255, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
