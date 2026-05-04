/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        '7xl': '80rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eefcf9',
          100: '#d5f7f0',
          200: '#aceee2',
          300: '#74dfcf',
          400: '#3bcab8',
          500: '#18b3a2',
          600: '#109386',
          700: '#0f756d',
          800: '#115d58',
          900: '#124d49',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 16px 0 rgba(16, 147, 134, 0.08)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 25px -5px rgba(16, 147, 134, 0.14), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'glow': '0 0 24px rgba(24, 179, 162, 0.2)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};