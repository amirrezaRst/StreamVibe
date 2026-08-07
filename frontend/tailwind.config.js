/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1.2rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
          "3xl": "7rem"
        },
      },
      aspectRatio: {
        "thumbnail": "4 / 4.5",
      },
      screens: {
        "3xl": "2000px"
      },
      fontSize: {
        "super-xs": "0.815rem",
        "super-sm": "0.925rem",
        "super-base": "1.07rem",
        "1.5xl": "1.38rem",
        "2.5xl": "1.65rem",
        "3.5xl": "2.05rem",
        "4.5xl": "2.65rem",
      },
      colors: {
        "c-black-06": "#0F0F0F",
        "c-black-08": "#141414",
        "c-black-10": "#1A1A1A",
        "c-black-12": "#1F1F1F",
        "c-black-15": "#262626",
        "c-black-20": "#333333",
        "c-black-25": "#404040",
        "c-black-30": "#4D4D4D",
        //! the dimmest grey that still clears 4.5:1 as text on every ground the
        //! app uses, from c-black-06 up to c-black-15. c-black-30 was carrying
        //! muted labels at 2.26:1 — it stays, but for borders and fills, not
        //! for anything anyone has to read.
        "c-grey-55": "#8C8C8C",
        "c-grey-60": "#999999",
        "c-grey-65": "#A6A6A6",
        "c-grey-70": "#B3B3B3",
        "c-grey-75": "#BFBFBF",
        "c-grey-90": "#E4E4E7",
        "c-grey-95": "#F1F1F3",
        "c-grey-97": "#F7F7F8",
        "c-grey-99": "#FCFCFD",
        "c-red-45": "#E50000",
        "c-red-50": "#FF0000",
        "c-red-55": "#FF1A1A",
        "c-red-60": "#FF3333",
        "c-red-80": "#FF9999",
        "c-red-90": "#FFCCCC",
        "c-red-95": "#FFE5E5",
        "c-red-99": "#FFFAFA",
      },
      minWidth: {
        "400": "400px",
        "450": "450px",
        "500": "500px",
        "550": "550px",
        "600": "600px",
        "650": "650px",
      },
      maxWidth: {
        "400": "400px",
        "450": "450px",
        "500": "500px",
        "550": "550px",
        "600": "600px",
        "650": "650px",
      },
      transitionDuration: {
        "400": "400ms",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
