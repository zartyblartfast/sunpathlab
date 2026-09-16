import assert from "node:assert/strict";
import { test } from "node:test";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["app.js", "index.html", "styles.css", "core/constants.js", "core/flat.js",
  "core/globe.js", "core/index.js", "core/math.js", "core/shadow.js", "core/snapshot.js",
  "core/solar.js", "core/time.js"].sort();
const require = createRequire(import.meta.url);
const baseline = require("./fixtures/prototype-v0.1.json");
const { evaluateCase } = require("./support/prototype.cjs");

async function manifest(directory) {
  const names = (await readdir(directory, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath ?? entry.path, entry.name));
  const result = {};
  for (const name of names.sort()) {
    const relative = name.slice(directory.length + 1).replaceAll("\\", "/");
    result[relative] = createHash("sha256").update(await readFile(name)).digest("hex");
  }
  return result;
}

test("build ships only allowed source files, cleans stale output and is reproducible", async () => {
  assert.ok(existsSync(join(root, "scripts/build.mjs")), "copy build must exist");
  const scratch = await mkdtemp(join(root, ".build-test-"));
  try {
    await mkdir(join(scratch, "scripts"));
    await cp(join(root, "scripts/build.mjs"), join(scratch, "scripts/build.mjs"));
    await cp(join(root, "package.json"), join(scratch, "package.json"));
    await cp(join(root, "src"), join(scratch, "src"), { recursive: true });
    await writeFile(join(scratch, "src/not-for-deployment.txt"), "synthetic exclusion sentinel");
    await mkdir(join(scratch, "dist/stale"), { recursive: true });
    await writeFile(join(scratch, "dist/stale/old.js"), "stale");
    // Run from another cwd to verify paths are relative to the build script.
    const build = () => execFileSync(process.execPath, [join(scratch, "scripts/build.mjs")], { cwd: root });
    build();
    const first = await manifest(join(scratch, "dist"));
    assert.deepEqual(Object.keys(first).sort(), files);
    for (const file of files) {
      assert.deepEqual(await readFile(join(scratch, "dist", file)), await readFile(join(root, "src", file)), file);
    }
    build();
    assert.deepEqual(await manifest(join(scratch, "dist")), first);
    const html = await readFile(join(scratch, "dist/index.html"), "utf8");
    assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
    // The built calculation graph must execute, not merely exist on disk.
    const core = await import(pathToFileURL(join(scratch, "dist/core/index.js")));
    const source = await import("../src/core/index.js");
    for (const fixture of baseline.cases) {
      assert.deepEqual(evaluateCase(core, fixture.input), evaluateCase(source, fixture.input), fixture.name);
    }
    // Check every static JS module edge and local HTML asset within the output.
    for (const file of files.filter(file => file.endsWith(".js"))) {
      const code = await readFile(join(scratch, "dist", file), "utf8");
      for (const [, specifier] of code.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
        assert.ok(specifier.startsWith("./") || specifier.startsWith("../"), "no runtime packages");
        assert.ok(existsSync(join(scratch, "dist", dirname(file), specifier)), `${file}: ${specifier}`);
      }
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
