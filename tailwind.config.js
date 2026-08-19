/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        surfacemuted: '#f4f5f7',
        ink: '#111827',
        inkmuted: '#6b7280',
        line: '#e5e7eb',
        accent: '#2563eb',
        accentdark: '#1d4ed8',
        accentsoft: '#dbeafe',
      },
    },
  },
  plugins: [],
}
