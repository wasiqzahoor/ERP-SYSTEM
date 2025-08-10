/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blue-violet': '#8A2B4B', // Custom blueviolet color
      },
      keyframes: {
        'smoke-effect': {
          // Isko slide karne ke liye banate hain
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        // Animation ko thora slow aur behtar banate hain
        'smoke': 'smoke-effect 10s linear infinite',
      }
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },  
  },
  plugins: [],
}