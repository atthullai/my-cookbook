import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const subject = execSync("git log -1 --pretty=%s", { encoding: "utf8" }).trim();
const files = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const today = new Date().toISOString().slice(0, 10);

const note = [`\n## ${today} - ${sha}`, "", `- ${subject}`, `- Changed modules: ${files.slice(0, 12).join(", ")}${files.length > 12 ? ", ..." : ""}`, "- Migration notes: no database migration included.", "- Deployment: GitHub main triggers Vercel production deployment.", ""].join("\n");

appendFileSync("CHANGELOG.md", note);
console.log(`Release notes appended for ${sha}`);
