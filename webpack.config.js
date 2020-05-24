const path = require("path");
const nodeExternals = require("webpack-node-externals");
// const webpack = require("webpack");

module.exports = {
  entry: "./index.js",
  // mode: "development",
  mode: "production",
  target: "node",
  externals: [nodeExternals()],

  // plugins: [
  //   new webpack.LoaderOptionsPlugin({
  //     // test: /\.xxx$/, // may apply this only for some modules
  //     options: {
  //       exclude: ["src/components/processRequest/settings.json"],
  //     },
  //   }),
  // ],

  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build"),
  },
};
