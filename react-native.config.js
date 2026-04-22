module.exports = {
  dependencies: {
    // react-native-pytorch-core@0.2.x expects a React Native AAR file that
    // no longer ships with RN 0.71+. Exclude it from Android autolinking so
    // the build succeeds; model.js falls back to the local inference server.
    // iOS exclusion is handled separately in ios/Podfile.
    'react-native-pytorch-core': {
      platforms: {
        android: null,
      },
    },
  },
};
