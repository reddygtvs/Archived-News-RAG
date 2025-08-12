/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'rgb(17, 17, 16)',
        'bg-secondary': 'rgb(25, 25, 24)',
        'bg-tertiary': 'rgb(39, 39, 37)',
        
        // Text colors
        'text-primary': 'rgb(238, 238, 236)',
        'text-secondary': 'rgb(181, 179, 173)',
        'text-accent': 'rgb(255, 255, 255)',
        
        // Border colors
        'border-default': 'rgb(55, 55, 53)',
        'border-hover': 'rgb(75, 75, 73)',
        
        // Hover background
        'hover-bg': 'rgb(39, 39, 37)',
        
        // Spotify green accent
        'spotify': '#39ff14',
        'spotify-hover': '#2ee000',
      },
      fontFamily: {
        inter: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif'
        ],
      },
      animation: {
        'bounce-smooth': 'bounce-smooth 2s ease-in-out 2',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        'bounce-smooth': {
          '0%, 20%, 50%, 80%, 100%': {
            transform: 'translateY(0px)',
          },
          '40%': {
            transform: 'translateY(-8px)',
          },
          '60%': {
            transform: 'translateY(-4px)',
          },
        },
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}