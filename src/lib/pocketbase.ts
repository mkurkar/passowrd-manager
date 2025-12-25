import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

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
