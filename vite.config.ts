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
    // The || provides a fallback for local development if .env file is not used.
    'process.env': {
      // For Gemini API, as per guidelines. Both vars point to the same key for safety.
      'API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || "AIzaSyBs3K8CjvD971gvEYnxWe8lUmpmQYbnPP0"),
      'VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY || "AIzaSyBs3K8CjvD971gvEYnxWe8lUmpmQYbnPP0"),
      
      // Firebase keys
      'VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || "AIzaSyCDVu-V9bUwQfFwlpMRTBukgq4qOECMhMA"),
      'VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || "fluxo-5a851.firebaseapp.com"),
      'VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || "fluxo-5a851"),
      'VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || "fluxo-5a851.appspot.com"),
      'VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "236220940687"),
      'VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID || "1:236220940687:web:b6cf3c1bb269ffff684bfa"),
    }
  }
})