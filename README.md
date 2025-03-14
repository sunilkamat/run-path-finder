# Run Path Finder

A web application that helps runners find and plan their running routes. The app generates loop routes based on a starting location and desired distance, optimizing for walkable paths and green areas.

## Features

- Generate loop running routes based on start location and distance
- Multiple route patterns (Triangle and Loop) with different orientations
- View route details including distance and elevation gain
- Interactive map display with route visualization
- Location search using OpenStreetMap data
- Export routes as GPX files for use in GPS devices and fitness apps
- Routes optimized for:
  - Green areas (parks, trails)
  - Quiet paths
  - Walkable terrain (avoiding steps)
- Multiple route suggestions for each search
- Real-time route preview

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenRouteService API key (free tier available)
- AWS account (for deployment)

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
   OPENROUTE_API_KEY=your_api_key_here
   ```
   Get your API key from [OpenRouteService](https://openrouteservice.org/)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

To deploy the application using AWS Amplify:

1. Install AWS Amplify dependencies:
   ```bash
   npm install aws-amplify @aws-amplify/adapter-nextjs
   ```

2. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)

3. Click "New app" → "Host web app"

4. Choose "GitHub" as your repository source and connect your repository

5. Configure the build settings:
   - Build Settings:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: .next
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
     ```

6. Add environment variables in the Amplify Console:
   - Go to App settings → Environment variables
   - Add `OPENROUTE_API_KEY` with your API key value
   - Save and deploy

7. After deployment, you can:
   - Set up a custom domain in the Amplify Console
   - Or create a CNAME record in your domain's DNS settings pointing to the Amplify app URL
   - Or add a redirect from your personal website to the Amplify app URL

The app will be automatically deployed whenever you push changes to your repository.

## Technologies Used

- Next.js 14 (App Router)
- React
- JavaScript
- Tailwind CSS
- Leaflet for maps
- OpenRouteService API for route generation
- OpenStreetMap (Nominatim) for location search
- AWS Amplify for deployment

## Route Generation

The application generates routes using the following strategies:
- Triangle patterns (3 points) for simple loops
- Square patterns (4 points) for more varied routes
- Multiple rotations (0°, 45°, 90°, 135°) for better path options
- Routes are optimized for:
  - Distance accuracy (within 50% of target)
  - Green areas and quiet paths
  - Proper loop closure
  - Elevation distribution

## GPX Export

The application supports exporting routes in GPX format, which is widely used for sharing GPS tracking data. Each generated route can be exported as a GPX file containing:
- Route track points with precise latitude and longitude
- Elevation data for each point
- Route metadata and identification
- Standard GPX 1.1 format compatible with most GPS devices and fitness apps

To export a route:
1. Generate routes by selecting a location and distance
2. Click the "Export GPX" button on any route card
3. The GPX file will be automatically downloaded and can be imported into your preferred GPS device or fitness app

## Known Limitations

- Route generation may be less reliable in areas with limited road/path coverage
- Some locations may require shorter distances for successful route generation
- Maximum route distance is capped at 30km
- Route generation success depends on OpenRouteService API availability

## License

MIT
