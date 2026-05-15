import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ngopiyuk.coffeetracker',
  appName: 'Ngopi Yuk',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // Muncul selama 2 detik
      launchAutoHide: true,
      backgroundColor: "#121212", // Warna background splash
      androidScaleType: "small",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;