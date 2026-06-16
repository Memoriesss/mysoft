/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"Noto Sans SC"', "system-ui", "sans-serif"],
        body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
        cute: ['"Fredoka"', '"Comic Sans MS"', "cursive"],
      },
      colors: {
        cream: "#FFE9A8",
        strawberry: "#FF8FA3",
        mint: "#7FD8A4",
        lavender: "#B79CED",
        cocoa: "#5B3A29",
        sky: "#A8D8F0",
        lemon: "#FFE066",
        paper: "#FFF8E7",
        dusk: "#F4EEE0",
        forest: "#9CD7A6",
        tangerine: "#FFC078",
      },
      boxShadow: {
        chunky: "0 6px 0 0 rgba(91,58,41,0.18), 0 18px 32px -10px rgba(91,58,41,0.18)",
        pill: "0 4px 0 0 rgba(91,58,41,0.18)",
        soft: "0 10px 30px -8px rgba(91,58,41,0.18)",
      },
      borderRadius: {
        chunk: "28px",
        bubble: "26px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        drift: {
          "0%": { transform: "translateX(-20px)" },
          "100%": { transform: "translateX(110vw)" },
        },
        whoosh: {
          "0%": { transform: "translateY(20px) scale(0.8)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(0.8) rotate(0deg)", opacity: "0.6" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "1" },
        },
        mouth: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        bgShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        pop: "pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        blink: "blink 4s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out",
        drift: "drift 28s linear infinite",
        whoosh: "whoosh 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        sparkle: "sparkle 2.4s ease-in-out infinite",
        mouth: "mouth 0.6s ease-in-out infinite",
        bgShift: "bgShift 16s ease infinite",
      },
    },
  },
  plugins: [],
};
