import next from "eslint-config-next";

/**
 * Flat config. `eslint-config-next` exports an ARRAY of config objects in
 * v16, not a factory — spreading the call result is the shape the older docs
 * show and it throws.
 */
const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
];

export default config;
