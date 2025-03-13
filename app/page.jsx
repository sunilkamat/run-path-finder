'use client';

import { useState } from 'react';
import RunningForm from './components/RunningForm';
import dynamic from 'next/dynamic';

// Dynamically import the map component with no SSR
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
});

export default function Home() {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const handleRoutesGenerated = (newRoutes) => {
    setRoutes(newRoutes);
    setSelectedRouteId(null); // Reset selection when new routes are generated
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Running Path Generator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <RunningForm onRoutesGenerated={handleRoutesGenerated} />
            
            {routes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Generated Routes</h2>
                <div className="space-y-4">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedRouteId === route.id
                          ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedRouteId(route.id === selectedRouteId ? null : route.id)}
                    >
                      <h3 className="font-medium">Route {route.id.split('-')[1]}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <p>Distance: {route.distance.toFixed(2)} km</p>
                        <p>Elevation Gain: {route.elevationGain}m</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Map routes={routes} selectedRouteId={selectedRouteId} />
          </div>
        </div>
      </div>
    </main>
  );
} 