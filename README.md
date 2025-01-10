# PixelFrame

Welcome! 

## Technologies & Key Packages

This project uses:
- **React**: Frontend UI library
- **Vite**: Build tool and development server
- **Three.js** & **React Three Fiber**: 3D graphics and rendering
- **Mapbox GL**: Interactive mapping capabilities
- **Redux Toolkit**: State management
- **Axios**: HTTP client for API requests
- **SASS**: Advanced CSS preprocessing

## Folder Structure

```
pixelframe/
├── frontend/
│ ├── src/ # Source code files
│ │ ├── App.jsx # Main React component
│ │ ├── main.jsx # Entry point
│ │ └── .css # Styling files
│ ├── public/ # Static assets, 
│ ├── dist/ # Built files (created when building)
│ ├── node_modules/ # Project dependencies
│ ├── package.json # Project configuration, the configuration of how the project runs.
│ └── vite.config.js # Vite configuration, the configuration of how the project is built. 
```

## How to Run Locally

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher)
2. Open a terminal in this directory. If you do not have this directory locally, `git clone` with this repo address. 
3. Install dependencies via `npm install`
4. Start the development server via `npm run dev`
5. Open your browser and visit `http://localhost:5173`

## How to Build for Production

Vercel is managed for all builds to production, and manages deploys for branches as well. However, if you need to debug further via building locally, you can run `npm run build`. The built files will be in the `dist` directory. 

## Important Directories Explained

- `src/`: Contains all the React source code and components
- `public/`: Stores static assets that don't need processing. ie images, fonts, things that won't change and aren't code.
- `dist/`: Contains the production-ready files after building, this is the code that actually gets deployed to the server.
- `node_modules/`: Contains all installed dependencies such as Mapbox or a 3D viewer. Don't edit this folder directly, as its managed via `package.json`, `package-lock.json`, and `npm`. 

## Available Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Builds the app for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check code quality

## Dependencies

### Main Dependencies
- `react` & `react-dom`: Core React libraries
- `@react-three/fiber` & `@react-three/drei`: React bindings for Three.js
- `three`: 3D graphics library
- `mapbox-gl`: Interactive mapping
- `@reduxjs/toolkit` & `react-redux`: State management
- `axios`: HTTP client

### Development Dependencies
- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: React plugin for Vite
- `eslint` & related plugins: Code quality tools
- `sass`: CSS preprocessor

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

See LICENSE file.
   
