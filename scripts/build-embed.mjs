// The embed SDK lives in public/embed.js (plain JS, no build). This script only checks it parses.
import { readFileSync } from "node:fs";
new Function(readFileSync("public/embed.js", "utf8"));
console.log("embed.js parses ok");
