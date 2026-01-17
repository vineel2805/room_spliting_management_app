/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'coral': '#FF7A45',
        'amber': '#FFB347',
        'money-green': '#16A34A',
        'money-red': '#DC2626',
        'money-neutral': '#64748B',
        'accent-orange': '#FB923C',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #FF7A45, #FFB347)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'fab': '0 4px 12px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
}
