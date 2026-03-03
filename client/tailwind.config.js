/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e17',
          darker: '#060a12',
          card: '#111827',
          border: '#1e293b',
          green: '#00ff88',
          red: '#ff3366',
          blue: '#00bbff',
          yellow: '#ffcc00',
          purple: '#aa66ff',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow':     'pulseGlow 2s ease-in-out infinite',
        'fade-in':        'fadeIn 0.4s ease-out both',
        'fade-in-slow':   'fadeIn 1s ease-out both',
        'slide-up':       'slideUp 0.4s ease-out both',
        'slide-down':     'slideDown 0.4s ease-out both',
        'slide-left':     'slideLeft 0.35s ease-out both',
        'slide-right':    'slideRight 0.35s ease-out both',
        'scale-in':       'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'bounce-in':      'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'shake':          'shake 0.45s ease-in-out',
        'glow-pulse':     'glowPulse 1.5s ease-in-out infinite',
        'float':          'float 3s ease-in-out infinite',
        'scan-line':      'scanLine 1.5s linear infinite',
        'type-in':        'typeIn 0.6s steps(20) both',
        'flip-in':        'flipIn 0.5s ease-out both',
        'stagger-1':      'slideUp 0.4s 0.05s ease-out both',
        'stagger-2':      'slideUp 0.4s 0.1s ease-out both',
        'stagger-3':      'slideUp 0.4s 0.15s ease-out both',
        'stagger-4':      'slideUp 0.4s 0.2s ease-out both',
        'stagger-5':      'slideUp 0.4s 0.25s ease-out both',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)' },
        },
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown:{ '0%': { opacity: '0', transform: 'translateY(-24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideLeft:{ '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideRight:{ '0%': { opacity: '0', transform: 'translateX(-24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:  { '0%': { opacity: '0', transform: 'scale(0.85)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceIn: {
          '0%':  { opacity: '0', transform: 'scale(0.3)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '80%': { transform: 'scale(0.97)' },
          '100%':{ transform: 'scale(1)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '15%':     { transform: 'translateX(-6px)' },
          '30%':     { transform: 'translateX(6px)' },
          '45%':     { transform: 'translateX(-4px)' },
          '60%':     { transform: 'translateX(4px)' },
          '75%':     { transform: 'translateX(-2px)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.7' },
          '50%':     { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        typeIn: {
          '0%':   { width: '0', opacity: '0' },
          '100%': { width: '100%', opacity: '1' },
        },
        flipIn: {
          '0%':   { opacity: '0', transform: 'perspective(400px) rotateX(-30deg)' },
          '100%': { opacity: '1', transform: 'perspective(400px) rotateX(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
