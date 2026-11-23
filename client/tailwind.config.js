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
        estc: {
          blue: '#004b82',
          'blue-hover': '#003a66',
          'blue-dark': '#002f52',
          'blue-light': '#f0f5fa',
          'blue-subtle': '#e1ebf4',
          gray: '#868889',
          'gray-light': '#f8f9fa',
          'gray-border': '#e2e5e7',
          'gray-dark': '#555758',
        },
        blue: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#b8d0e5',
          300: '#8eb4d5',
          400: '#4783b8',
          500: '#004b82', // ESTC Blue
          600: '#004b82', // ESTC Blue
          700: '#003a66',
          800: '#002f52',
          900: '#002038',
          950: '#001524',
        },
        navy: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          800: '#2b333e',
          900: '#004b82', // Replace generic navy with ESTC Blue
          950: '#002f52',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#868889', // ESTC Gray
          600: '#6b7280',
          700: '#4b5563',
          800: '#374151',
          900: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
