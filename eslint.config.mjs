import globals from "globals";
import pluginJs from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
// Note: You'll need to install this plugin with: npm install eslint-plugin-sonarjs --save-dev

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    plugins: {
      sonarjs
    }
  },
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
        SnowBrawlUI: "writable",
        Utils: "readonly",
        CharacterModels: "readonly"
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
      "no-alert": "off",   // Allow alerts for user feedback
      
      // Duplicate code detection
      // Note: This requires installing eslint-plugin-sonarjs
      // After adding this rule, run: npm install eslint-plugin-sonarjs --save-dev
      "sonarjs/no-duplicate-string": ["warn", { "threshold": 3 }],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-redundant-boolean": "warn",
      "sonarjs/no-small-switch": "warn"
    }
  }
];