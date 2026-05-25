import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ESLINT CONFIG MAP
// ESLint is the "code checker" run by npm run lint.
// These settings use Next.js defaults and ignore build-output folders.

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='key'] JSXExpressionContainer > Identifier[name=/^(index|.*Index)$/]",
          message:
            "Do not use array indexes as React keys. Use a stable recipe, ingredient, badge, timing, nutrition, or step id.",
        },
      ],
    },
  },
]);

export default eslintConfig;
