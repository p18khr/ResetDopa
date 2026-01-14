# React Native App (Expo)

A React Native mobile application built with Expo.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your mobile device (optional, for testing)

### Installation

Install the project dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm start
```

This will open the Expo Developer Tools in your browser. From there, you can:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your mobile device

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Project Structure

```
.
├── App.js              # Main app component
├── app.json            # Expo configuration
├── package.json        # Project dependencies
├── babel.config.js     # Babel configuration
└── assets/             # Images and other assets
```

## Next Steps

1. **Replace placeholder assets**: Add your app icon, splash screen, and other images in the `assets/` folder
2. **Customize the app**: Edit `App.js` to build your app's UI
3. **Add navigation**: Consider installing React Navigation for multi-screen apps
4. **Add state management**: Use React Context, Redux, or other state management solutions as needed

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Documentation](https://react.dev/)
