// Procedurally draws a stylized equirectangular Earth texture onto a 2D
// canvas: dark ocean base + simplified continent silhouettes with glowing
// cyan coastlines. This keeps the project free of large image assets while
// still reading clearly as "a globe with continents and oceans".
//
// Coordinates are coarse, hand-placed approximations of real coastlines —
// good enough for a stylized dashboard globe, not for cartographic accuracy.

const CONTINENTS = [
  {
    name: 'North America',
    points: [
      [71, -156], [70, -141], [69, -125], [60, -95], [62, -80], [50, -65],
      [45, -60], [40, -74], [30, -81], [25, -97], [18, -95], [15, -92],
      [8, -77], [7, -80], [12, -83], [18, -105], [23, -110], [32, -117],
      [40, -124], [48, -124], [55, -133], [60, -140], [65, -150],
    ],
  },
  {
    name: 'South America',
    points: [
      [12, -72], [8, -77], [0, -79], [-5, -81], [-18, -70], [-23, -70],
      [-33, -72], [-40, -73], [-53, -73], [-55, -68], [-52, -64], [-38, -58],
      [-23, -43], [-13, -38], [-5, -35], [0, -50], [5, -60], [8, -70],
    ],
  },
  {
    name: 'Africa',
    points: [
      [37, 10], [32, -9], [14, -17], [6, -11], [4, -8], [4, 9], [-1, 9],
      [-6, 12], [-18, 12], [-22, 14], [-34, 18], [-33, 26], [-25, 32],
      [-16, 39], [-4, 39], [5, 44], [11, 50], [12, 44], [15, 39], [22, 37],
      [28, 34], [31, 32], [32, 25], [31, 20], [32, 15],
    ],
  },
  {
    name: 'Europe',
    points: [
      [71, 25], [68, 14], [65, 12], [60, 5], [55, 5], [52, 3], [50, -5],
      [43, -9], [36, -6], [37, 15], [40, 18], [45, 13], [45, 15], [45, 30],
      [50, 30], [55, 38], [60, 40], [65, 35], [70, 30],
    ],
  },
  {
    name: 'Asia',
    points: [
      [70, 60], [65, 55], [60, 60], [55, 50], [45, 48], [40, 50], [30, 48],
      [15, 43], [12, 50], [8, 77], [8, 80], [10, 92], [15, 98], [10, 105],
      [8, 105], [1, 104], [-6, 106], [-8, 115], [-2, 120], [5, 125],
      [15, 120], [22, 120], [30, 122], [35, 130], [40, 140], [45, 140],
      [52, 142], [60, 163], [65, 178], [70, 170], [75, 140], [77, 105], [73, 80],
    ],
  },
  {
    name: 'Australia',
    points: [
      [-12, 131], [-11, 142], [-17, 146], [-24, 153], [-33, 151], [-38, 147],
      [-38, 140], [-32, 134], [-31, 116], [-25, 113], [-20, 114], [-14, 127],
    ],
  },
  {
    name: 'Greenland',
    points: [
      [83, -35], [70, -55], [65, -50], [62, -45], [65, -40], [70, -22], [78, -20],
    ],
  },
  {
    name: 'Madagascar',
    points: [
      [-12, 49], [-25, 47], [-25, 43], [-15, 45],
    ],
  },
]

function project(lat, lon, width, height) {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return [x, y]
}

function drawSmoothPolygon(ctx, points) {
  if (points.length < 3) return
  ctx.beginPath()
  ctx.moveTo((points[0][0] + points[points.length - 1][0]) / 2, (points[0][1] + points[points.length - 1][1]) / 2)
  for (let i = 0; i < points.length; i++) {
    const curr = points[i]
    const next = points[(i + 1) % points.length]
    const midX = (curr[0] + next[0]) / 2
    const midY = (curr[1] + next[1]) / 2
    ctx.quadraticCurveTo(curr[0], curr[1], midX, midY)
  }
  ctx.closePath()
}

export function createEarthCanvas(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Ocean base — subtle vertical gradient, darker at the poles
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height)
  oceanGradient.addColorStop(0, '#031320')
  oceanGradient.addColorStop(0.15, '#052538')
  oceanGradient.addColorStop(0.5, '#073349')
  oceanGradient.addColorStop(0.85, '#052538')
  oceanGradient.addColorStop(1, '#031320')
  ctx.fillStyle = oceanGradient
  ctx.fillRect(0, 0, width, height)

  // Faint ocean texture noise
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const r = Math.random() * 1.6
    ctx.fillStyle = Math.random() > 0.5 ? '#4fd8e8' : '#02121e'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Faint lat/lon graticule
  ctx.strokeStyle = 'rgba(120, 200, 215, 0.06)'
  ctx.lineWidth = 1
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = project(0, lon, width, height)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const [, y] = project(lat, 0, width, height)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Continents
  const landGradient = ctx.createLinearGradient(0, 0, 0, height)
  landGradient.addColorStop(0, '#2b3a2e')
  landGradient.addColorStop(0.5, '#3a4a35')
  landGradient.addColorStop(1, '#2b3a2e')

  CONTINENTS.forEach((continent) => {
    const projected = continent.points.map(([lat, lon]) => project(lat, lon, width, height))
    drawSmoothPolygon(ctx, projected)
    ctx.fillStyle = landGradient
    ctx.fill()

    // glowing cyan coastline — the signature visual touch
    ctx.save()
    ctx.shadowColor = 'rgba(79, 216, 232, 0.9)'
    ctx.shadowBlur = 6
    ctx.strokeStyle = 'rgba(120, 224, 236, 0.55)'
    ctx.lineWidth = 1.4
    ctx.stroke()
    ctx.restore()
  })

  // Polar ice caps
  const iceTop = ctx.createLinearGradient(0, 0, 0, height * 0.09)
  iceTop.addColorStop(0, 'rgba(200, 235, 240, 0.85)')
  iceTop.addColorStop(1, 'rgba(200, 235, 240, 0)')
  ctx.fillStyle = iceTop
  ctx.fillRect(0, 0, width, height * 0.09)

  const iceBottom = ctx.createLinearGradient(0, height * 0.91, 0, height)
  iceBottom.addColorStop(0, 'rgba(200, 235, 240, 0)')
  iceBottom.addColorStop(1, 'rgba(210, 240, 245, 0.9)')
  ctx.fillStyle = iceBottom
  ctx.fillRect(0, height * 0.91, width, height * 0.09)

  return canvas
}

export function createTemperatureCanvas(temperatureAt, temperatureColor, depth, width = 512, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  for (let py = 0; py < height; py++) {
    const lat = 90 - (py / height) * 180
    for (let px = 0; px < width; px++) {
      const lon = (px / width) * 360 - 180
      const t = temperatureAt(lat, lon, depth)
      ctx.fillStyle = temperatureColor(t)
      ctx.fillRect(px, py, 1, 1)
    }
  }

  // re-draw faint coastlines on top so continents stay legible
  ctx.strokeStyle = 'rgba(10, 15, 20, 0.35)'
  ctx.lineWidth = 1
  CONTINENTS.forEach((continent) => {
    const projected = continent.points.map(([lat, lon]) => project(lat, lon, width, height))
    drawSmoothPolygon(ctx, projected)
    ctx.stroke()
  })

  return canvas
}
