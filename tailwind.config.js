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
        'primary': '#FF7A45',
        'primary-light': 'var(--color-primary-light)',
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'success': '#22C55E',
        'success-light': 'var(--color-success-light)',
        'error': '#EF4444',
        'error-light': 'var(--color-error-light)',
        'divider': 'var(--color-divider)',
        'border': 'var(--color-divider)',
        'coral': '#FF7A45',
        'money-green': '#22C55E',
        'money-red': '#EF4444',
        'money-neutral': '#64748B',
        'accent-orange': '#FF7A45',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'dock': '0 -4px 20px rgba(0,0,0,0.08)',
        'fab': '0 4px 20px rgba(255,122,69,0.35)',
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'card': '14px',
        'button': '12px',
        'pill': '999px',
        'dock': '24px',
      },
    },
  },
  plugins: [],
}
