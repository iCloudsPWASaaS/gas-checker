import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf5",
          100: "#d6f9e6",
          200: "#b0f1d0",
          300: "#7ae4b1",
          400: "#3fce8b",
          500: "#19b46e",
          600: "#0d9159",
          700: "#0c734a",
          800: "#0d5b3d",
          900: "#0c4b34",
          950: "#052a1d"
        },
        ink: "#0b1220"
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)",
        float: "0 18px 50px -12px rgba(5,42,29,.25)"
      }
    },
  },
  plugins: [],
};

export default config;
