import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WhatsApp-inspired colors
        primary: {
          DEFAULT: '#00a884',
          light: '#25d366',
          dark: '#008069',
        },
        secondary: {
          DEFAULT: '#8696a0',
          light: '#aebac1',
        },
        background: {
          DEFAULT: '#111b21',
          light: '#202c33',
          lighter: '#2a3942',
          chat: '#0b141a',
        },
        surface: {
          DEFAULT: '#202c33',
          hover: '#2a3942',
        },
        accent: {
          green: '#00a884',
          teal: '#008069',
          blue: '#53bdeb',
          purple: '#8696a0',
        },
        text: {
          primary: '#e9edef',
          secondary: '#8696a0',
          light: '#d1d7db',
        },
        border: {
          DEFAULT: '#2a3942',
          light: '#3b4a54',
        },
        incoming: '#202c33',
        outgoing: '#005c4b',
        danger: '#f15c6d',
        warning: '#ffc107',
        success: '#00a884',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'chat': '0 1px 0.5px rgba(11, 20, 26, 0.13)',
        'modal': '0 3px 10px rgba(11, 20, 26, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        typing: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

