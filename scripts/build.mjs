import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Explicit deployment allowlist: never copy configuration or arbitrary files.
// Paths are relative to this script, independent of the caller's working directory.
const source = new URL("../src/", import.meta.url);
const output = new URL("../dist/", import.meta.url);
const files = [
  "index.html", "styles.css", "app.js",
  "core/constants.js", "core/math.js", "core/solar.js", "core/time.js",
  "core/globe.js", "core/flat.js", "core/shadow.js", "core/snapshot.js", "core/index.js"
];

// Read every required input before replacing generated output. A missing source
// therefore fails without destroying the previously working deployment files.
const contents = await Promise.all(files.map(file => readFile(new URL(file, source))));
await rm(output, { recursive: true, force: true });
for (const [index, file] of files.entries()) {
  const target = new URL(file, output);
  await mkdir(new URL("./", target), { recursive: true });
  await writeFile(target, contents[index]);
}
console.log(`Built ${files.length} static files in ${fileURLToPath(output)}`);
