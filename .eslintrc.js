module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: "eslint:recommended",
  rules: {
    eqeqeq: "error",
    "comma-dangle": ["error", "always-multiline"],
    curly: ["error", "multi"],
    "no-unexpected-multiline": "error",
    "no-case-declarations": "warn",
    "no-console": ["warn"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"]
  }
};
