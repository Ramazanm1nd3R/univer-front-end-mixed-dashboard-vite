import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    // Алиасы под слои Feature-Sliced Design.
    // Порядок не важен (Vite разрешает по самому длинному совпадению),
    // но я держу их сверху вниз — так же, как разрешено импортировать:
    // app может тянуть из любого, shared — ни из кого.
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },

  // Vitest подхватывает эту секцию автоматически — отдельного vitest.config не нужно.
  test: {
    environment: 'jsdom',
    globals: true, // describe/it/expect без явных импортов
    setupFiles: './src/setupTests.js',
  },
})
