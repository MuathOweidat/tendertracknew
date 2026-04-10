/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f2d56',
          dark:    '#081d38',
          mid:     '#1a4080',
          light:   '#e8eef8',
        },
        brand: {
          DEFAULT: '#1e66d4',
          dark:    '#1550b0',
          light:   '#ebf2fd',
          lighter: '#d6e7fb',
        },
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'slide-up':    'slideUp .22s cubic-bezier(.4,0,.2,1)',
        'slide-right': 'slideRight .22s cubic-bezier(.4,0,.2,1)',
        'pop-in':      'popIn .18s cubic-bezier(.4,0,.2,1)',
        'badge-pop':   'badgePop .25s ease',
        'new-row':     'newRowPulse 2.5s ease-in-out 3, newRowSlideIn .35s cubic-bezier(.4,0,.2,1)',
        'new-dot':     'newDotBlink 1.4s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s ease-in-out infinite',
        'spin-slow':   'spin 2s linear infinite',
      },
      keyframes: {
        slideUp:      { from: { opacity:0, transform:'translateY(8px)' }, to: { opacity:1, transform:'none' } },
        slideRight:   { from: { opacity:0, transform:'translateX(40px)' }, to: { opacity:1, transform:'none' } },
        popIn:        { from: { opacity:0, transform:'scale(.94)' }, to: { opacity:1, transform:'scale(1)' } },
        badgePop:     { '0%': { transform:'scale(.6)' }, '60%': { transform:'scale(1.15)' }, '100%': { transform:'scale(1)' } },
        newRowPulse:  { '0%': { boxShadow:'inset 3px 0 0 #10b981' }, '50%': { boxShadow:'inset 3px 0 0 #10b981, 0 0 0 4px rgba(16,185,129,.1)' }, '100%': { boxShadow:'inset 3px 0 0 #10b981' } },
        newRowSlideIn:{ from: { opacity:0, transform:'translateX(-6px)' }, to: { opacity:1, transform:'translateX(0)' } },
        newDotBlink:  { '0%,100%': { opacity:1, transform:'scale(1)' }, '50%': { opacity:.3, transform:'scale(.7)' } },
        shimmer:      { '0%': { backgroundPosition:'-400px 0' }, '100%': { backgroundPosition:'400px 0' } },
      },
      boxShadow: {
        navy: '0 4px 14px rgba(15,45,86,.35)',
        card: '0 1px 3px rgba(15,29,56,.08), 0 1px 2px rgba(15,29,56,.06)',
      },
    },
  },
  plugins: [],
}
