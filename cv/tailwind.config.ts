import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-custom': 'linear-gradient(180deg, #202030 0%, #1C0E21 100%)' // Add your custom gradient here
      },
      fontFamily: {
        honk: ['var(--font-honk)'],
      },
      fontSize: {
        sm: '0.6rem',
      },
      colors: {
        white: '#FFDDFF',
        gray: '#DD33DD',
        black: '#1C0E21',
      },
    },
  },
  plugins: [require("daisyui")],
}
export default config
