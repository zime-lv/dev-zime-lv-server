const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./index.js",
  // mode: "development",
  mode: "production",
  target: "node",
  externals: [nodeExternals()],

  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build"),
  },
};
