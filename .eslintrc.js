// https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#groups-array
const DEFAULT_ORDER = ["builtin", "external", "parent", "sibling", "index"];

module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    settings: {
        "import/resolver": {
            typescript: true,
            node: true
        },

    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module",
        project: "./tsconfig.json",
    },
    "plugins": [
        "react",
        "@typescript-eslint",

    ],
    "rules": {
        "import/order": ["error", {"groups": DEFAULT_ORDER, "alphabetize": {"order": "asc", "caseInsensitive": true}}]
    }
};
