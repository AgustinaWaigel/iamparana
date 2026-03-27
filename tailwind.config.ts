import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          brown: "#622d0d",
          cream: "#f3f6f4",
          gold: "#d4a373",
        },
      },
      backgroundImage: {
        "areas-texture": "url(/assets/textures/areasg.webp)",
      },
    },
  },
  plugins: [],
};

export default config;
