import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, Geometry, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";

type CountryProperties = { name: string };
type Country = Feature<Geometry, CountryProperties>;

export type CountryShape = {
  path: string;
  box: { x: number; y: number; width: number; height: number };
};

const topology = world as unknown as Topology<{ countries: GeometryCollection<CountryProperties> }>;
const countries = feature(topology, topology.objects.countries).features;

const mainlandOnly = ["United States of America", "France", "Norway", "Netherlands", "Spain", "Portugal"];
const roundIsland: CountryShape = {
  path: "M45 75a55 55 0 1 0 110 0a55 55 0 1 0 -110 0z",
  box: { x: 45, y: 20, width: 110, height: 110 },
};
const shapes = new Map<string, CountryShape>();

function keepParts(country: Country, keep: (part: Polygon["coordinates"], index: number) => boolean): Country {
  if (country.geometry.type !== "MultiPolygon") return country;
  return { ...country, geometry: { type: "MultiPolygon", coordinates: country.geometry.coordinates.filter(keep) } };
}

function mainParts(country: Country, nearbyOnly: boolean): Country[] {
  if (country.geometry.type !== "MultiPolygon") return [country];
  const parts = country.geometry.coordinates.map((coordinates) => {
    const polygon: Polygon = { type: "Polygon", coordinates };
    return { area: geoArea(polygon), centre: geoCentroid(polygon) };
  });
  const largest = parts.reduce((a, b) => (b.area > a.area ? b : a));
  const main = keepParts(
    country,
    (_, index) =>
      parts[index].area >= largest.area * 0.01 &&
      (!nearbyOnly || geoDistance(parts[index].centre, largest.centre) < 0.2),
  );
  return [main, keepParts(country, (_, index) => parts[index] === largest)];
}

function project(shape: Country) {
  const [longitude, latitude] = geoCentroid(shape);
  const projection = geoAzimuthalEqualArea()
    .rotate([-longitude, -latitude])
    .fitExtent([[12, 12], [188, 138]], shape);
  return geoPath(projection);
}

function drawCountry(name: string): CountryShape {
  const found = countries.find((country) => country.properties.name === name);
  if (!found) return roundIsland;
  const [main, largestOnly] = mainParts(found, mainlandOnly.includes(name));
  const mainDraw = project(main);
  const tooSpread = largestOnly && mainDraw.area(main) < 176 * 126 * 0.05;
  const shape = tooSpread ? largestOnly : main;
  const draw = tooSpread ? project(largestOnly) : mainDraw;
  const [[x0, y0], [x1, y1]] = draw.bounds(shape);
  return {
    path: draw(shape) ?? roundIsland.path,
    box: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
  };
}

export function countryShape(name: string): CountryShape {
  if (!shapes.has(name)) shapes.set(name, drawCountry(name));
  return shapes.get(name)!;
}
