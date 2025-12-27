import PocketBase from 'pocketbase';
import { Platform } from 'react-native';

// Default PocketBase URL - should be configured for production
// For Android emulator, use 10.0.2.2 to reach host machine
// For iOS simulator, use 127.0.0.1
// For physical devices, use your machine's local IP (e.g., 192.168.1.100)
const getDefaultUrl = () => {
  if (process.env.EXPO_PUBLIC_POCKETBASE_URL) {
    return process.env.EXPO_PUBLIC_POCKETBASE_URL;
  }
  // Android emulator uses 10.0.2.2 to reach host's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8090';
  }
  // iOS simulator and web can use localhost
  return 'http://127.0.0.1:8090';
};

const POCKETBASE_URL = getDefaultUrl();

const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation for better control
pb.autoCancellation(false);

export default pb;

export type AuthModel = {
  id: string;
  email: string;
  name: string;
  created: string;
  updated: string;
};

// Helper to update PocketBase URL at runtime
export function updatePocketBaseUrl(url: string) {
  pb.baseUrl = url;
}

// Get current PocketBase URL
export function getPocketBaseUrl(): string {
  return pb.baseUrl;
}
