# Run Path Finder

A web application that helps runners find and plan their running routes. The app generates circular routes based on a starting location and desired distance, with options for elevation preferences.

## Features

- Generate running routes based on start location and distance
- Choose between kilometers and miles
- Option to prefer flatter routes
- View route details including distance and elevation gain
- Export routes as GPX files for use in other apps
- Save favorite routes for future reference
- Interactive map display
- Multiple route suggestions for each search

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenRouteService API key (free tier available)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/run-path-finder.git
   cd run-path-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your OpenRouteService API key:
   ```
   NEXT_PUBLIC_ORS_API_KEY=your_api_key_here
   ```
   Get your API key from [OpenRouteService](https://openrouteservice.org/)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- Next.js 14
- React
- JavaScript
- Tailwind CSS
- Leaflet for maps
- OpenRouteService API for route generation
- OpenStreetMap for location search

## License

MIT
