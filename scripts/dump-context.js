const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "code-context.generated.yaml");

const isBinary = (buf) => buf.includes(0);
const toUnix = (p) => p.replace(/\\/g, "/");

const writeLine = (stream, line) => stream.write(`${line}\n`);

const folders = [];
const files = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = toUnix(path.relative(root, full));
    if (entry.isDirectory()) {
      folders.push(rel);
      walk(full);
    } else if (entry.isFile()) {
      files.push({ full, rel });
    }
  }
};

walk(root);

const stream = fs.createWriteStream(out, { encoding: "utf8" });

writeLine(stream, "generated_at: 2026-04-28");
writeLine(stream, `root: \"${toUnix(root)}\"`);
writeLine(stream, "folders:");
for (const folder of folders) {
  writeLine(stream, `  - \"${folder}\"`);
}

writeLine(stream, "files:");
for (const file of files) {
  writeLine(stream, `  - path: \"${file.rel}\"`);

  const data = fs.readFileSync(file.full);
  if (isBinary(data)) {
    writeLine(stream, "    encoding: base64");
    writeLine(stream, "    content_base64: |");
    const b64 = data.toString("base64");
    for (let i = 0; i < b64.length; i += 76) {
      writeLine(stream, `      ${b64.slice(i, i + 76)}`);
    }
    continue;
  }

  writeLine(stream, "    content: |");
  const text = data.toString("utf8");
  if (text.length === 0) {
    writeLine(stream, "      ");
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    writeLine(stream, `      ${line}`);
  }
}

stream.end();
