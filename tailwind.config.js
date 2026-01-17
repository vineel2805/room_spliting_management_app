/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FF7A45',
        'primary-light': '#FFF7ED',
        'background': '#F8FAFC',
        'surface': '#FFFFFF',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
        'success': '#22C55E',
        'success-light': '#F0FDF4',
        'error': '#EF4444',
        'error-light': '#FEF2F2',
        'divider': '#E2E8F0',
        'border': '#E2E8F0',
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
