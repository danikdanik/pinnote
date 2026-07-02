import { build, context } from "esbuild";
import { copyFileSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

const MAIN_BANNER = "/* PinNote — https://github.com/pinnote/pinnote */";

async function buildMain() {
  const options = {
    entryPoints: ["src/index.js"],
    bundle: true,
    format: "iife",
    outfile: "dist/pinnote.js",
    target: ["chrome100", "edge100", "firefox100", "safari16"],
    legalComments: "inline",
    banner: { js: MAIN_BANNER },
  };

  if (watch) {
    const ctx = await context(options);
    await ctx.watch();
  } else {
    await build(options);
  }
}

async function buildExtension() {
  await build({
    entryPoints: ["src/errors.js"],
    bundle: true,
    format: "iife",
    outfile: "extension/errors.js",
    target: ["chrome100"],
    legalComments: "inline",
    banner: { js: MAIN_BANNER },
  });

  copyFileSync("dist/pinnote.js", "extension/pinnote.js");
}

if (watch) {
  await buildMain();
  console.log("watching src/ for changes…");
} else {
  await buildMain();
  await buildExtension();
  console.log("built dist/pinnote.js and extension/pinnote.js + extension/errors.js");
}
