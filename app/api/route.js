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

      const maxDistance = 30;
      const adjustedDistance = Math.min(distance, maxDistance);

      const routeVariations = generateRouteVariations([longitude, latitude], adjustedDistance);
      const validRoutes = [];

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
              instructions: true,
              elevation: true,
              preference: 'recommended',
              options: {
                "avoid_features": ["steps"],
                "profile_params": {
                  "weightings": {
                    "green": 0.5,
                    "quiet": 0.3
                  }
                }
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to generate ${pattern.name} route:`, errorText);
            continue;
          }

          const routeData = await response.json();
          if (routeData.features && routeData.features.length > 0) {
            const route = transformRouteData(routeData)[0];
            
            // Check if it's a proper loop (start and end points are close enough)
            const coords = route.coordinates;
            const startPoint = coords[0];
            const endPoint = coords[coords.length - 1];
            const isLoop = Math.abs(startPoint[0] - endPoint[0]) < 0.0001 && 
                          Math.abs(startPoint[1] - endPoint[1]) < 0.0001;
            
            if (!isLoop) {
              console.log('Skipping non-loop route');
              continue;
            }

            // More lenient distance matching for initial routes
            const tolerance = Math.max(1, adjustedDistance * 0.5); // 50% tolerance or 1km
            if (Math.abs(route.distance - adjustedDistance) <= tolerance) {
              validRoutes.push({
                ...route,
                id: `route-${validRoutes.length + 1}`,
                name: pattern.name,
                pattern: pattern.name
              });

              if (validRoutes.length >= 3) {
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error generating ${pattern.name} route:`, error);
          continue;
        }
      }

      if (validRoutes.length > 0) {
        // Sort routes by how close they are to the desired distance
        validRoutes.sort((a, b) => 
          Math.abs(a.distance - adjustedDistance) - Math.abs(b.distance - adjustedDistance)
        );

        return NextResponse.json(validRoutes.slice(0, 3));
      }

      throw new Error('Could not find suitable routes. Try a different location or shorter distance.');
    }

    throw new Error('Invalid service specified');
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Could not generate routes. Try a different location or shorter distance.' },
      { status: 500 }
    );
  }
}

function generateRouteVariations(startPoint, targetDistance) {
  const variations = [];
  
  // Adjust radius factors based on target distance
  const getRadiusFactor = (distance) => {
    if (distance >= 10) return 0.15; // For 10km+
    if (distance >= 5) return 0.12;  // For 5-10km
    return 0.1;                     // For shorter distances
  };

  const radiusFactor = getRadiusFactor(targetDistance);
  
  // Simplified patterns for better road network compatibility
  const patterns = [
    { 
      points: 3, 
      radiusFactor: radiusFactor * 1.0, 
      name: 'Triangle',
      angles: [0, 120, 240]
    },
    { 
      points: 4, 
      radiusFactor: radiusFactor * 0.9, 
      name: 'Loop',
      angles: [0, 90, 180, 270]
    }
  ];

  // Try different rotations for each pattern
  const rotations = [0, 45, 90, 135];

  for (const pattern of patterns) {
    for (const baseRotation of rotations) {
      const waypoints = [];
      
      // Calculate radius based on target distance
      const radiusKm = targetDistance * pattern.radiusFactor;

      // Convert km to degrees (approximate)
      const latKmPerDegree = 111;
      const lngKmPerDegree = 111 * Math.cos((startPoint[1] * Math.PI) / 180);

      // Generate waypoints with current rotation
      pattern.angles.forEach(angle => {
        const rotatedAngle = (angle + baseRotation) % 360;
        const rad = (rotatedAngle * Math.PI) / 180;
        
        // Calculate point with slight random variation for better road snapping
        const variation = (Math.random() - 0.5) * 0.02; // Small random adjustment
        const lat = startPoint[1] + (radiusKm / latKmPerDegree) * Math.cos(rad) + variation;
        const lng = startPoint[0] + (radiusKm / lngKmPerDegree) * Math.sin(rad) + variation;
        
        waypoints.push([lng, lat]);
      });

      // Add start/end point
      const routeWaypoints = [startPoint, ...waypoints, startPoint];
      
      // Add the route with direction name
      const directionName = getDirectionName(baseRotation);
      variations.push({ 
        waypoints: routeWaypoints,
        pattern: { ...pattern, name: `${pattern.name} ${directionName}` }
      });
    }
  }

  return variations;
}

// Helper function to get direction name
function getDirectionName(angle) {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle >= 315 || normalizedAngle < 45) return "North";
  if (normalizedAngle >= 45 && normalizedAngle < 135) return "East";
  if (normalizedAngle >= 135 && normalizedAngle < 225) return "South";
  return "West";
}

function transformRouteData(routeData) {
  if (!routeData.features || !routeData.features[0]) {
    throw new Error('Invalid route data received');
  }

  const routes = routeData.features.map(feature => {
    const properties = feature.properties?.summary || {};
    const distance = properties.distance / 1000 || 0; // Convert to km
    
    // Calculate elevation gain from the elevation data
    let elevationGain = 0;
    if (feature.geometry?.coordinates) {
      const coordinates = feature.geometry.coordinates;
      for (let i = 1; i < coordinates.length; i++) {
        const prevElevation = coordinates[i - 1][2] || 0;
        const currentElevation = coordinates[i][2] || 0;
        const gain = currentElevation - prevElevation;
        if (gain > 0) {
          elevationGain += gain;
        }
      }
    }

    return {
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