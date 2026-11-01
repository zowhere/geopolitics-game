import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, Geometry, Polygon } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-50m.json'

type CountryProperties = { name: string }
type Country = Feature<Geometry, CountryProperties>

const topology = world as unknown as Topology<{ countries: GeometryCollection<CountryProperties> }>
const countries = feature(topology, topology.objects.countries).features

const mainlandOnly = ['United States of America', 'France', 'Norway', 'Netherlands', 'Spain', 'Portugal']
const roundIsland = 'M70 75a30 30 0 1 0 60 0a30 30 0 1 0 -60 0z'
const paths = new Map<string, string>()

function mainland(country: Country): Country {
  if (country.geometry.type !== 'MultiPolygon') return country
  const parts = country.geometry.coordinates.map(coordinates => {
    const polygon: Polygon = { type: 'Polygon', coordinates }
    return { coordinates, area: geoArea(polygon), centre: geoCentroid(polygon) }
  })
  const largest = parts.reduce((a, b) => (b.area > a.area ? b : a))
  const nearby = parts.filter(part => geoDistance(part.centre, largest.centre) < 0.2)
  return { ...country, geometry: { type: 'MultiPolygon', coordinates: nearby.map(part => part.coordinates) } }
}

function drawCountry(name: string): string {
  const found = countries.find(country => country.properties.name === name)
  if (!found) return roundIsland
  const shape = mainlandOnly.includes(name) ? mainland(found) : found
  const [longitude, latitude] = geoCentroid(shape)
  const projection = geoAzimuthalEqualArea()
    .rotate([-longitude, -latitude])
    .fitExtent([[12, 12], [188, 138]], shape)
  return geoPath(projection)(shape) ?? roundIsland
}

export function countryPath(name: string): string {
  if (!paths.has(name)) paths.set(name, drawCountry(name))
  return paths.get(name)!
}
