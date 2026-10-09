import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// /api calls from React are forwarded to the Express server (port 4000)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
