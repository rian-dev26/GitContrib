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
        app: {
          bg: 'rgb(var(--color-app-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--color-app-sidebar) / <alpha-value>)',
          card: 'rgb(var(--color-app-card) / <alpha-value>)',
          secondary: 'rgb(var(--color-app-secondary) / <alpha-value>)',
          border: 'rgb(var(--color-app-border) / <alpha-value>)',
          text: {
            primary: 'rgb(var(--color-app-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--color-app-text-secondary) / <alpha-value>)',
          },
          accent: {
            primary: 'rgb(var(--color-app-accent-primary) / <alpha-value>)',
            'primary-hover': 'rgb(var(--color-app-accent-primary-hover) / <alpha-value>)',
            secondary: 'rgb(var(--color-app-accent-secondary) / <alpha-value>)',
            positive: 'rgb(var(--color-app-accent-positive) / <alpha-value>)',
            negative: 'rgb(var(--color-app-accent-negative) / <alpha-value>)',
          },
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      width: {
        'sidebar-expanded': '248px',
        'sidebar-collapsed': '72px',
      },
      height: {
        header: '68px',
      },
    },
  },
  plugins: [],
};
