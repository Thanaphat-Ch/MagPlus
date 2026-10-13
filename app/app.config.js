import 'dotenv/config';

export default {
  expo: {
    name: "app",
    slug: "app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "app",
    userInterfaceStyle: "automatic",
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.akethanick.app",
    },
    ios: { supportsTablet: true },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-web-browser",
      "expo-router",
      ["expo-splash-screen", {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }]
    ],
    experiments: { typedRoutes: true },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL,
      eas: {
        projectId: "c55bea43-2687-45a7-b501-4b5ceea9d3a3"
      }
    }
  }
};
