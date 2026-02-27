import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({ dark: 'class' }),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  theme: {
    colors: {
      surface: {
        DEFAULT: '#1a1a2e',
        light: '#222240',
        lighter: '#2a2a4a',
      },
      accent: {
        DEFAULT: '#d4a574',
        light: '#e8c9a0',
      },
      text: {
        DEFAULT: '#e0e0e0',
        muted: '#888',
      },
    },
  },
})
