/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: "#0B0C0E",       // Deep neutral base
        bgCard: "#131518",       // Rich card background
        borderDark: "#1F2328",   // Premium dark borders
        brandBlue: "#2563EB",    // Restrained professional blue
        brandBlueHover: "#3B82F6",
        brandGreen: "#10B981",    // Success / Recovered
        brandYellow: "#F59E0B",   // Warning / Guardrail Blocked
        brandRed: "#EF4444",      // Critical / Revenue Lost
        textMuted: "#8A94A6",     // Muted gray text
        textLight: "#F3F4F6",     // High-contrast light text
      }
    },
  },
  plugins: [],
}
