const esbuild = require("esbuild");
const path = require("path");

async function build() {
  console.log("[Build] Bundling backend with esbuild...");
  const options = {
    entryPoints: [path.join(__dirname, "src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    footer: {
      js: "if (module.exports.default) module.exports = module.exports.default;"
    }
  };

  // Build to dist/index.js
  await esbuild.build({
    ...options,
    outfile: path.join(__dirname, "dist/index.js")
  });

  // Build to index.js
  await esbuild.build({
    ...options,
    outfile: path.join(__dirname, "index.js")
  });

  console.log("[Build] Successfully bundled backend to dist/index.js and index.js.");
}

build().catch((err) => {
  console.error("[Build Error]", err);
  process.exit(1);
});
