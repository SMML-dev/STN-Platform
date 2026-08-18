/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        stn: {
          primary: '#0a4d8c',
          secondary: '#0d6efd',
          accent: '#00b4d8',
          dark: '#052c52',
          light: '#e8f1f8'
        }
      }
    }
  },
  plugins: []
};
