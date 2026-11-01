import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, Geometry, Polygon } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

type CountryProperties = { name: string }
type Country = Feature<Geometry, CountryProperties>

const topology = world as unknown as Topology<{ countries: GeometryCollection<CountryProperties> }>
const countries = feature(topology, topology.objects.countries).features

const mainlandOnly = ['United States of America']

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

export function countryPath(name: string): string {
  const found = countries.find(country => country.properties.name === name)
  if (!found) throw new Error(`No map shape for ${name}`)
  const shape = mainlandOnly.includes(name) ? mainland(found) : found
  const [longitude, latitude] = geoCentroid(shape)
  const projection = geoAzimuthalEqualArea()
    .rotate([-longitude, -latitude])
    .fitExtent([[12, 12], [188, 138]], shape)
  return geoPath(projection)(shape) ?? ''
}
