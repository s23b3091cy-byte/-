/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rise: {
          DEFAULT: '#16a34a',
          light: '#dcfce7',
          text: '#15803d',
        },
        fall: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
          text: '#b91c1c',
        },
        flat: {
          DEFAULT: '#6b7280',
          light: '#f3f4f6',
          text: '#374151',
        },
      },
    },
  },
  plugins: [],
}
