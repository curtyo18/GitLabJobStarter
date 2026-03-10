import archiver from "archiver";
import { createWriteStream, readFileSync } from "fs";
import { resolve } from "path";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));
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
