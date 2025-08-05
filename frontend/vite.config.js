import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      overlay: false, // 減少錯誤覆蓋層的性能影響
    },
    watch: {
      usePolling: false, // 使用文件系統事件而非輪詢
      ignored: ['**/node_modules/**', '**/.git/**'], // 忽略不必要的文件監控
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          charts: ['recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', 'recharts'],
    exclude: ['fsevents'], // 排除 macOS 特定的文件監控庫
  },
}) 