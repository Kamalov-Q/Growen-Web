/**
 * Writes `public/theme-init.js` from the one definition in the theme module.
 *
 * The script has to be a real FILE, not an inline tag: React 19 refuses to
 * execute an inline script it renders on the client and logs an error about
 * it, while an external `src` is a hoistable resource it handles properly.
 *
 * Generated rather than hand-written so the storage KEY cannot drift. If the
 * file held its own copy of "growencity.theme" and the module later changed,
 * the two would disagree silently and the only symptom would be a theme that
 * forgets itself on reload — which nobody would trace back to here.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("src/features/theme/theme.tsx", "utf8");

const key = src.match(/const KEY = "([^"]+)"/)?.[1];
if (!key) throw new Error("gen-theme-init: KEY not found in theme.tsx");

const body = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  key,
)});if(c==="light"||c==="dark"){document.documentElement.setAttribute("data-theme",c)}}catch(e){}})();\n`;

mkdirSync("public", { recursive: true });
writeFileSync("public/theme-init.js", body);
console.log(`gen-theme-init: wrote public/theme-init.js (key: ${key})`);
