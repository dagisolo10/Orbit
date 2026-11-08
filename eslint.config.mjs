import tseslint from "@electron-toolkit/eslint-config-ts";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig(
    { ignores: ["**/node_modules", "**/dist", "**/out"] },
    tseslint.configs.recommended,
    eslintPluginReact.configs.flat.recommended,
    eslintPluginReact.configs.flat["jsx-runtime"],
    {
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "react-hooks": eslintPluginReactHooks,
            "react-refresh": eslintPluginReactRefresh,
        },
        rules: {
            ...eslintPluginReactRefresh.configs.vite.rules,
            ...eslintPluginReactHooks.configs.recommended.rules,
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            // The codebase uses typed React components; runtime prop validation is unnecessary.
            "react/prop-types": "warn",
            // Data-loading and sync effects are intentional across the app's providers.
            "react-hooks/set-state-in-effect": "warn",
        },
    },
);
