import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "iife",
  outfile: "dist/pinnote.js",
  target: ["chrome100", "edge100", "firefox100", "safari16"],
  legalComments: "inline",
  banner: {
    js: "/* PinNote — https://github.com/pinnote/pinnote — MIT */",
  },
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching src/ for changes…");
} else {
  await build(options);
  console.log("built dist/pinnote.js");
}
