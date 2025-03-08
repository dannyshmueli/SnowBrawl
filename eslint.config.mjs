import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        // Add THREE.js as a global
        THREE: "readonly",
        // Add our game globals
        GAME_CONSTANTS: "readonly",
        Game: "writable",
        SnowBrawlGame: "writable", // Changed from GameClass to avoid conflicts
        Map: "readonly",
        GameMap: "readonly",
        Physics: "readonly",
        Player: "readonly",
        AIPlayer: "readonly",
        AI: "readonly",
        Snowball: "readonly",
        UI: "readonly",
        Utils: "readonly"
      }
    },
    rules: {
      // Error prevention
      "no-undef": "error",
      "no-unused-vars": "warn",
      "no-use-before-define": ["error", { "functions": false }],
      "no-global-assign": "error",
      
      // Type safety
      "eqeqeq": ["error", "always"],
      "no-implicit-globals": "error",
      
      // Best practices
      "no-var": "warn",
      "prefer-const": "warn",
      "no-console": "off", // Allow console for debugging
      "no-alert": "off"   // Allow alerts for user feedback
    }
  }
];