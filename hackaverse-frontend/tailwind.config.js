/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e27',
        'bg-secondary': '#1a1f3a',
        'accent-primary': '#00d9ff',
        'accent-secondary': '#7c3aed',
        'text-primary': '#ffffff',
        'text-secondary': '#a0aec0',
        'text-muted': '#718096',
      },
    },
  },
  plugins: [],
}
