import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f5',
          100: '#fce7eb',
          200: '#fad1d9',
          300: '#f5a8b7',
          400: '#ee738f',
          500: '#e3486e',
          600: '#cf2a5c',
          700: '#ae1f4d',
          800: '#921d47',
          900: '#7d1c42',
        },
        secondary: {
          50: '#f9f7f4',
          100: '#f2ede6',
          200: '#e3d9ca',
          300: '#d1bfa9',
          400: '#bea188',
          500: '#b08a6f',
          600: '#a37b63',
          700: '#886554',
          800: '#705449',
          900: '#5c453c',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-playfair)', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
