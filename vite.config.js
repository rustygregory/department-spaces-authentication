import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from a GitHub Pages project subpath, so assets must resolve
  // relative to /department-spaces-authentication/ rather than the domain root.
  base: '/department-spaces-authentication/',
  plugins: [react()],
})
