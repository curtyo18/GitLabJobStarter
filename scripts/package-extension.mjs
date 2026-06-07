import archiver from "archiver";
import { createWriteStream, readFileSync, existsSync } from "fs";
import { resolve } from "path";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

// Guard against zipping a stale build: dist/ is gitignored and only the build
// regenerates it, so a forgotten rebuild after `npm version` would ship the old
// version. vite.config.ts derives the manifest version from package.json, so any
// mismatch here means dist/ predates the current version.
if (!existsSync("./dist/manifest.json")) {
  console.error("dist/ does not exist — run `npm run build` first");
  process.exit(1);
}
const distVersion = JSON.parse(readFileSync("./dist/manifest.json", "utf-8")).version;
if (distVersion !== version) {
  console.error(
    `dist/ is stale: manifest.json is v${distVersion} but package.json is v${version} — run \`npm run build\` first`,
  );
  process.exit(1);
}

const outputPath = resolve(`./gitlab-job-starter-v${version}.zip`);

const output = createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(
    `Packaged: gitlab-job-starter-v${version}.zip (${(archive.pointer() / 1024).toFixed(1)} KB)`
  );
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.directory("dist/", false);
archive.finalize();
