/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      { tally: {
        primary: '#7c3aed',
        secondary: '#0ea5e9',
        accent: '#22d3ee',
        neutral: '#1f2937',
        'base-100': '#0b0f17',
        'base-200': '#111827',
        'base-300': '#1f2937',
        info: '#3abff8',
        success: '#36d399',
        warning: '#fbbd23',
        error: '#f87272',
      } },
      'light',
    ],
  },
};
