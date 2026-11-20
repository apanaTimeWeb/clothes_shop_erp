import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": "error",
    },
  },
  {
    files: ["**/*.test.tsx"],
    rules: { "@next/next/no-img-element": "off", "jsx-a11y/alt-text": "off" },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
