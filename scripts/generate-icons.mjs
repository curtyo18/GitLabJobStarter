import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const svg = readFileSync("./src/icons/icon.svg", "utf-8");
const sizes = [16, 48, 128];

mkdirSync("./public/icons", { recursive: true });

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  writeFileSync(`./public/icons/icon${size}.png`, png);
  console.log(`Generated icon${size}.png (${size}x${size})`);
}
