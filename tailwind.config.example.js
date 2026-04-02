/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': '#00FF41',
        'pure-black': '#000000',
      },
      fontFamily: {
        'identity': ['"Playfair Display"', 'serif'],
        'data': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'ekg-pulse': 'ekg-pulse 3s linear infinite',
        'line-scan': 'line-scan 2s ease-in-out infinite',
      },
      keyframes: {
        'ekg-pulse': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'line-scan': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 65, 0.5), 0 0 20px rgba(0, 255, 65, 0.3)',
        'glow-green-intense': '0 0 15px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.5), 0 0 45px rgba(0, 255, 65, 0.3)',
      },
    },
  },
  plugins: [],
}
