import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { projectRoot } from "./with-app-env.mjs";

function filesIn(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".output") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesIn(path, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(path);
  }
  return out;
}

const root = projectRoot();
const files = filesIn(join(root, "src"));
let failed = 0;
for (const path of files) {
  const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, false, kind);
  for (const item of source.parseDiagnostics ?? []) {
    failed += 1;
    const at = source.getLineAndCharacterOfPosition(item.start ?? 0);
    const text = ts.flattenDiagnosticMessageText(item.messageText, " ");
    console.error(`${path}:${at.line + 1}:${at.character + 1} ${text}`);
  }
}
if (failed > 0) {
  console.error(`JSX/TS lỗi cú pháp: ${failed}. Không xuất bản.`);
  process.exit(1);
}
console.log(`JSX/TS ổn: ${files.length} file.`);
