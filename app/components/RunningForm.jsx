'use client';

import { useState, useEffect, useCallback } from 'react';

export default function RunningForm({ onRoutesGenerated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [distance, setDistance] = useState('5');
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState('');

  const handleLocationSearch = useCallback(async (query) => {
    if (query.length < 3) {
      setAddresses([]);
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, service: 'nominatim' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      setError('Error searching for location. Please try again.');
      setAddresses([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleLocationSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleLocationSearch]);

  const handleGenerateRoutes = async (e) => {
    e.preventDefault();
    if (!startLocation) {
      setError('Please select a start location');
      return;
    }

    setError('');
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [parseFloat(startLocation.lon), parseFloat(startLocation.lat)],
          distance: parseFloat(distance),
          service: 'openroute'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate routes');
      }

      const routes = await response.json();
      onRoutesGenerated(routes);
    } catch (err) {
      setError('Error generating routes. Please try again.');
    }
  };

  return (
    <form onSubmit={handleGenerateRoutes} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Location
          </label>
          <div className="relative">
            <input
              id="location"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a location..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
            {searchLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {addresses.length > 0 && !startLocation && (
            <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {addresses.map((address) => (
                <button
                  key={address.place_id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                  onClick={() => {
                    setStartLocation(address);
                    setSearchQuery(address.display_name);
                    setAddresses([]);
                  }}
                >
                  {address.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Desired Distance (km)
          </label>
          <select
            id="distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="3">3 km</option>
            <option value="5">5 km</option>
            <option value="8">8 km</option>
            <option value="10">10 km</option>
            <option value="15">15 km</option>
            <option value="21.1">21.1 km (Half Marathon)</option>
            <option value="42.2">42.2 km (Marathon)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        Generate Routes
      </button>
    </form>
  );
} 