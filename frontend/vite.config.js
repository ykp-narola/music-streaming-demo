import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';
// Read the SSL certificate and key
const key = fs.readFileSync(path.resolve(__dirname, 'server.key'));
const cert = fs.readFileSync(path.resolve(__dirname, 'server.crt'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key,
      cert,
    },
  },
  define: {
    global: {}
  },
})
