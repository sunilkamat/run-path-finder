'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map({ routes, selectedRouteId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.0060], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing route layers
    routeLayersRef.current.forEach(layer => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    routeLayersRef.current = [];

    // Add new routes
    if (routes.length > 0) {
      const bounds = L.latLngBounds();
      
      routes.forEach((route) => {
        // Only show the selected route, or all routes if none is selected
        if (!selectedRouteId || route.id === selectedRouteId) {
          const coordinates = route.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Extend bounds to include this route
          coordinates.forEach(coord => bounds.extend(coord));

          // Create a polyline for the route
          const polyline = L.polyline(coordinates, {
            color: route.isFavorite ? '#FF0000' : '#0000FF',
            weight: selectedRouteId ? 4 : 3,
            opacity: selectedRouteId ? 0.9 : 0.7
          }).addTo(mapInstanceRef.current);

          // Add popup with route information
          polyline.bindPopup(`
            <div>
              <strong>${route.id}</strong><br/>
              Distance: ${route.distance.toFixed(2)} km<br/>
              Elevation Gain: ${route.elevationGain}m
            </div>
          `);

          routeLayersRef.current.push(polyline);
        }
      });

      // Fit map to show all visible routes
      if (routeLayersRef.current.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [routes, selectedRouteId]);

  return <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />;
} 