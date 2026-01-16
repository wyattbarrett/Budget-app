/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#2dd4bf",
                "background-light": "#f6f8f7",
                "background-dark": "#0a0f1c",
                "surface-dark": "#131b2c",
                "surface-highlight": "#1f2937",
                "danger": "#ef4444",
                "muted-text": "#9ca3af",
                "ghost-text": "#6b7280",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"],
                "sans": ["Manrope", "sans-serif"],
            },
            boxShadow: {
                'glow-primary': '0 0 20px -5px rgba(45, 212, 191, 0.3)',
                'glow-danger': '0 0 15px -5px rgba(239, 68, 68, 0.4)',
            }
        },
    },
    plugins: [],
}
