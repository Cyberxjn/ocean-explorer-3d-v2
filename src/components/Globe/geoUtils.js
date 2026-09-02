// Converts geographic coordinates to a position on a sphere of given radius.
// Matches the UV mapping of three.js SphereGeometry so markers line up with
// the equirectangular texture drawn in earthTexture.js.
export function latLonToVector3(lat, lon, radius, target) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  if (target) {
    target.set(x, y, z)
    return target
  }
  return [x, y, z]
}
