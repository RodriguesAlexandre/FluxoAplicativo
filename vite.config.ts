import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    // Expose environment variables to the client.
    // The || '' provides a fallback to an empty string for local development
    // if .env file is not used, preventing the app from crashing.
    'process.env': {
      // For Gemini API, as per guidelines.
      'API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || ""),
      'VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY || ""),
      
      // Firebase keys
      'VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || ""),
      'VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || ""),
      'VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || ""),
      'VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || ""),
      'VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""),
      'VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID || ""),
    }
  }
})