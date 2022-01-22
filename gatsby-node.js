"use strict";

require("ts-node").register({
  compilerOptions: {
    module: "commonjs",
    target: "esnext",
  },
});

require("./src/__generated__/gatsby-types");

const {
  createPages,
  onCreateNode,
  createSchemaCustomization,
} = require("./src/gatsby/gatsby-node");

exports.createPages = createPages;
exports.onCreateNode = onCreateNode;
exports.createSchemaCustomization = createSchemaCustomization;
