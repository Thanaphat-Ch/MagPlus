/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#0d51e2",
        accent: '#F97316',
        danger: '#EF4444',
      },
      // fontSize: {
      //   tiny: 10,
      //   xs: 12,
      //   sm: 14,
      //   base: 16,
      //   lg: 18,
      //   xl: 20,
      //   '2xl': 24,
      // },
      
    },
  },
  plugins: [],
}