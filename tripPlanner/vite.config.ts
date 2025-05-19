import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sightTour': {
        target: 'http://ec2-3-6-138-99.ap-south-1.compute.amazonaws.com:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
