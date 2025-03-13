import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY;
const OPENROUTE_API_URL = 'https://api.openrouteservice.org';

export async function POST(request) {
  try {
    const body = await request.json();
    const { service, query, coordinates, distance } = body;

    if (service === 'nominatim') {
      // Handle location search using Nominatim
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.append('q', query);
      nominatimUrl.searchParams.append('format', 'json');
      nominatimUrl.searchParams.append('limit', '5');
      nominatimUrl.searchParams.append('addressdetails', '1');

      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'RunningPathGenerator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Nominatim');
      }

      const data = await response.json();
      return NextResponse.json(data);
    } 
    else if (service === 'openroute') {
      if (!OPENROUTE_API_KEY) {
        throw new Error('OpenRouteService API key is not configured');
      }

      // Validate coordinates and distance
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error('Invalid coordinates format. Expected [longitude, latitude]');
      }

      const [longitude, latitude] = coordinates;
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        throw new Error('Coordinates must be numbers');
      }

      if (typeof distance !== 'number' || distance <= 0) {
        throw new Error('Distance must be a positive number');
      }

      // Cap the maximum distance to prevent issues
      const maxDistance = 20; // 20km maximum
      const adjustedDistance = Math.min(distance, maxDistance);

      const routeVariations = generateRouteVariations([longitude, latitude], adjustedDistance);
      const allRoutes = [];
      let routeCounter = 0;

      for (const { waypoints, pattern } of routeVariations) {
        try {
          console.log('Trying route with pattern:', pattern.name);
          
          const response = await fetch(`${OPENROUTE_API_URL}/v2/directions/foot-walking/geojson`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
              'Accept': 'application/json, application/geo+json'
            },
            body: JSON.stringify({
              coordinates: waypoints,
              instructions: false,
              preference: 'shortest'
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to generate ${pattern.name} route:`, errorText);
            continue;
          }

          const routeData = await response.json();
          if (routeData.features && routeData.features.length > 0) {
            routeCounter++;
            const route = transformRouteData(routeData, routeCounter, pattern.name)[0];
            if (Math.abs(route.distance - adjustedDistance) <= adjustedDistance * 0.5) {
              allRoutes.push(route);
            }
          }
        } catch (error) {
          console.error(`Error generating ${pattern.name} route:`, error);
          continue;
        }
      }

      if (allRoutes.length === 0) {
        throw new Error('Could not generate valid routes. Try a shorter distance or different location.');
      }

      allRoutes.sort((a, b) => 
        Math.abs(a.distance - adjustedDistance) - Math.abs(b.distance - adjustedDistance)
      );

      return NextResponse.json(allRoutes.slice(0, 3));
    }

    throw new Error('Invalid service specified');
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRouteVariations(startPoint, targetDistance) {
  const variations = [];
  
  // Simpler patterns with much smaller radius factors
  const patterns = [
    { points: 4, radiusFactor: 0.1, name: 'Square' },    // Simple square route
    { points: 3, radiusFactor: 0.12, name: 'Triangle' }, // Simple triangle route
    { points: 2, radiusFactor: 0.15, name: 'Out-and-Back' } // Simple out-and-back route
  ];

  for (const pattern of patterns) {
    const waypoints = [];
    const angles = Array.from({ length: pattern.points }, (_, i) => (360 / pattern.points) * i);
    
    // Calculate a smaller radius based on the target distance
    const radiusKm = Math.min(targetDistance * pattern.radiusFactor, 0.5); // Cap at 500m radius

    // Convert km to degrees (approximate)
    const latKmPerDegree = 111; // roughly constant
    const lngKmPerDegree = 111 * Math.cos((startPoint[1] * Math.PI) / 180); // varies with latitude

    // For out-and-back pattern
    if (pattern.points === 2) {
      // Create a simple out-and-back route
      const angle = Math.random() * 360; // Random direction
      const rad = (angle * Math.PI) / 180;
      const lat = startPoint[1] + (radiusKm / latKmPerDegree) * Math.cos(rad);
      const lng = startPoint[0] + (radiusKm / lngKmPerDegree) * Math.sin(rad);
      waypoints.push(startPoint, [lng, lat], startPoint);
      variations.push({ waypoints, pattern });
      continue; // Skip the rest of the loop for out-and-back
    }

    // Generate main waypoints for other patterns
    angles.forEach(angle => {
      const rad = (angle * Math.PI) / 180;
      const lat = startPoint[1] + (radiusKm / latKmPerDegree) * Math.cos(rad);
      const lng = startPoint[0] + (radiusKm / lngKmPerDegree) * Math.sin(rad);
      waypoints.push([lng, lat]);
    });

    // Add start/end point and intermediate points
    const smoothedWaypoints = [startPoint];
    
    for (let i = 0; i < waypoints.length; i++) {
      smoothedWaypoints.push(waypoints[i]);
      
      // Add an intermediate point to the next waypoint
      if (i < waypoints.length - 1) {
        const next = waypoints[(i + 1) % waypoints.length];
        const intermediateLng = (waypoints[i][0] + next[0]) / 2;
        const intermediateLat = (waypoints[i][1] + next[1]) / 2;
        smoothedWaypoints.push([intermediateLng, intermediateLat]);
      }
    }

    // Complete the loop
    smoothedWaypoints.push(startPoint);
    variations.push({ waypoints: smoothedWaypoints, pattern });

    // Add reverse direction for non-out-and-back routes
    const reversedWaypoints = [
      startPoint,
      ...smoothedWaypoints.slice(1, -1).reverse(),
      startPoint
    ];
    variations.push({ 
      waypoints: reversedWaypoints, 
      pattern: { ...pattern, name: `${pattern.name} (Reverse)` }
    });
  }

  return variations;
}

function transformRouteData(routeData, routeNumber, patternName) {
  if (!routeData.features || !routeData.features[0]) {
    throw new Error('Invalid route data received');
  }

  const routes = routeData.features.map((feature, index) => {
    const distance = feature.properties?.summary?.distance / 1000 || 0; // Convert to km
    const elevationGain = feature.properties?.summary?.ascent || 0;

    return {
      id: `route-${routeNumber}`,
      name: `${patternName} Route`,
      coordinates: feature.geometry.coordinates,
      distance,
      elevationGain: Math.round(elevationGain),
      isFavorite: false
    };
  });

  return routes;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 