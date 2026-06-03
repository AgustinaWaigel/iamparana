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
          brown:    "#622d0d",
          deep:     "#3a1508",
          wood:     "#7a3a13",
          gold:     "#e3a92c",
          goldsoft: "#f4cd74",
          cream:    "#f6f1ea",
          paper:    "#fbf8f3",
          ink:      "#2c1d11",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;