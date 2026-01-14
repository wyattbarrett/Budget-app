/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#1f7a5c",
                "background-light": "#f6f8f7",
                "background-dark": "#17191c",
                "surface-dark": "#2C3036",
                "surface-highlight": "#353a41",
                "danger": "#CC2E2E",
                "muted-text": "#51565F",
                "ghost-text": "#6B7280",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"],
                "sans": ["Manrope", "sans-serif"],
            },
            boxShadow: {
                'glow-primary': '0 0 20px -5px rgba(31, 122, 92, 0.3)',
                'glow-danger': '0 0 15px -5px rgba(204, 46, 46, 0.4)',
            }
        },
    },
    plugins: [],
}
