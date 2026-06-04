// API Configuration
// Update the BASE_URL based on your development environment

import { Platform } from 'react-native';

// Determine the correct localhost URL based on platform
const getLocalhost = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return '10.0.2.2';
  }
  // iOS simulator and web can use localhost directly
  return 'localhost';
};

// Server configuration
const API_CONFIG = {
  // Development settings - update these as needed
  DEV_PORT: 5000,
  
  // Get the base URL based on environment
  get BASE_URL() {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }

    // For development, use local server
    // For production, replace with your actual server URL
    const host = getLocalhost();
    const url = `http://${host}:${this.DEV_PORT}/api`;
    return url;
  },
};

export default API_CONFIG;
