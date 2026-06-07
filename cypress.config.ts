import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3456",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },

  component: {
    indexHtmlFile: "cypress/support/component-index.html",
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
