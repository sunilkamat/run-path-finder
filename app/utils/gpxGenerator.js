export function generateGPX(route) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Run Path Finder"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">`;

  const name = `<name>Running Route ${route.id}</name>`;
  
  const trackPoints = route.coordinates
    .map(coord => {
      const [lon, lat, elevation = 0] = coord;
      return `    <trkpt lat="${lat}" lon="${lon}">
      <ele>${elevation}</ele>
    </trkpt>`;
    })
    .join('\n');

  const gpxContent = `${header}
  <trk>
    ${name}
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

  return gpxContent;
}

export function downloadGPX(route) {
  const gpxContent = generateGPX(route);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `running-route-${route.id}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 