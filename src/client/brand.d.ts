// public/brand/*.svg, bundled as text by esbuild (scripts/build.mjs) for a
// script to write the mark inline.
declare module "*.svg" {
  const svg: string;
  export default svg;
}
