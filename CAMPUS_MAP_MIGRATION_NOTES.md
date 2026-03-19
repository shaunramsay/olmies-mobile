# Campus Map Migration - Mobile React Native Integration

## Frontend Changes (Olmies-Mobile)
- **Dependencies**: Installed `react-native-maps` SDK via Expo.
- **UI Integration**: 
  - Rewrote `CampusMapScreen.js` to replace the static offline placeholder with a fully interactive `MapView`.
  - Implemented secure API fetching (`fetchWithAuth` via `AuthContext`) directly from the `/campushub/map/pois` endpoint.
  - Implemented custom coordinate translation logic matching the Web Admin panel to render DB points onto absolute OpenStreetMap/Google Maps coordinates (base Latitude `18.0167736` / Longitude `-76.7464894`).
  - Styled custom map `Marker` pins color-coded by category (Cyan for Buildings, Amber for Vendors, Emerald for Offices).
  - Implemented interactive popup `Callout` components displaying POI names, categories, and descriptions when a pin is tapped.

## Backend Dependencies
The mobile map relies on the matching `CampusHub` backend architecture that was simultaneously migrated into the `olmies-ai` repository. The C# database context now includes `CampusMapPois` and automatically seeds library and vendor locations on startup. 

## Next Steps Upon Device Switch
When pulling these changes onto the new workstation, **do not forget to run your package manager** to install the new SDK before launching the bundler:
```bash
npm install
# or
yarn install
```
Then start the app as normal:
```bash
npx expo start
```
