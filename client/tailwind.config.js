/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#FFF7F2',
          100: '#FFF0E8', // Primary peach background
          200: '#FFE2D3',
          300: '#FFD1BB',
          400: '#FFAB88',
        },
        coral: {
          DEFAULT: '#FF8B76', // Coral accent
          light: '#FFA695',
          dark: '#E8725C',
          50: '#FFF1EF',
          100: '#FFE0DC',
          500: '#FF8B76',
          600: '#EB725C',
        },
        sidebarOrange: {
          DEFAULT: '#FF9856', // Sidebar orange
          light: '#FFAE7A',
          dark: '#E8803D',
        },
        softYellow: {
          DEFAULT: '#FFE7A0', // Soft yellow
          light: '#FFF0BA',
          dark: '#F0D47C',
        },
        successGreen: {
          DEFAULT: '#74C99A', // Success green
          light: '#91D6AF',
          dark: '#59B180',
        },
        mainText: {
          DEFAULT: '#342D2B', // Main text
          muted: '#7E7571',
          light: '#A39A96',
        },
        cream: {
          DEFAULT: '#FFFBF7',
          card: '#FFFFFF',
          soft: '#FFF7F0',
        },
      },
      boxShadow: {
        'soft-peach': '0 10px 25px -5px rgba(255, 139, 118, 0.12), 0 8px 10px -6px rgba(255, 139, 118, 0.08)',
        'soft-card': '0 4px 20px -2px rgba(180, 100, 70, 0.06), 0 2px 6px -1px rgba(180, 100, 70, 0.04)',
        'glow-coral': '0 0 20px -3px rgba(255, 139, 118, 0.35)',
        'timer-glow': '0 12px 32px -4px rgba(255, 152, 86, 0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
