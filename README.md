# Route for Run 🏃‍♂️

Route for Run is a React Native mobile application built with [Expo](https://expo.dev/) designed for runners who want to dynamically generate a running route based on a specific target distance.

## 🚀 Features

- **Current Location Tracking:** Automatically detects your current location to use as the starting and finishing point for your run.
- **Dynamic Route Generation:** Input your desired running distance (in kilometers), and the app will generate a circular/triangular loop route returning to your starting location.
- **OSRM Integration:** Uses the project-OSRM routing API to calculate foot-router-friendly pathways.
- **Interactive Map:** Visualizes the start/finish marker and the exact path of the generated route directly on a map using `react-native-maps`.
- **Target Distance Matching:** Continually adjusts the radius coordinates to closely match your desired target distance before generating the route.

## 🛠️ Required Technologies & Libraries

- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps) - for cross-platform map views
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) - for fetching accurate device location
- [axios](https://axios-http.com/docs/intro) - for handling HTTP requests to the OSRM API
- [geolib](https://github.com/manuelbieh/geolib) - to calculate distance and coordinate angles geometrically

## 📱 Installation & Setup

1. **Clone the repository / Ensure you are in the project root directory.**
2. **Install all dependencies:**
   Make sure you have Node installed, then run the following command to install required packages:
   ```bash
   npm install
   ```
3. **Start the application:**
   Launch the Expo development server:
   ```bash
   npx expo start
   ```
4. Follow the instructions provided by the Expo CLI to open the app on your physical device via the Expo Go app or on an iOS/Android Simulator.

*Note: Ensure your device has location permissions granted to use the core features of the app successfully.*

## 💻 How it Works

1. The app first prompts for location permissions when opened and fetches your coordinates.
2. In the UI, enter your "Target Jarak" (Target Distance) in kilometers.
3. Once you hit **Buat Rute Lari** (Create Run Route), the app uses `geolib` to project coordinate points outward radially to build a triangular polygon shape representing a looped path.
4. An `axios` call fetches route pathways for these projected coordinates via `router.project-osrm.org`.
5. The application iteratively checks the actual mapped distance and smartly scales the points up or down to align with the chosen Target Distance. 
6. After finding a matching route, it handles mapping the polyline visually to the interactive MapView component.

## 📄 License & Status
This project was designed for straightforward route mapping. Given the utilization of free demo APIs (like OSRM), please respect their public deployment usage constraints if deploying to scale.
