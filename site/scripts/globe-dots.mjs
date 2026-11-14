// Regenerates src/data/globe-dots.json: land points on a ~1.5° grid from Natural Earth 110m.
// One-off: npm i world-atlas@2 topojson-client@3 d3-geo@3 somewhere outside the site, then
// node globe-dots.mjs <path>/src/data/globe-dots.json
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
const topo = JSON.parse(readFileSync(new URL("./node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);
const STEP = 1.5, pts = [];
for (let lat = -84; lat <= 84; lat += STEP) {
  const lonStep = STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.15);
  for (let lon = -180; lon < 180; lon += lonStep)
    if (geoContains(land, [lon, lat])) pts.push(Math.round(lon * 10) / 10, Math.round(lat * 10) / 10);
}
writeFileSync(process.argv[2], JSON.stringify(pts));
console.log(pts.length / 2, "dots");
