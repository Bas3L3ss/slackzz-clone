import type { Config } from "jest";
import nextJest from "next/jest";

// Create a Next.js-specific Jest config
const createJestConfig = nextJest({
  // Path to the Next.js app
  dir: "./",
});

// Extend or customize the Jest configuration
const config: Config = {
  preset: "ts-jest",
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  transformIgnorePatterns: ["/node_modules/(?!(react-medium-image-zoom)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

// Export the config for Jest
export default createJestConfig(config);
