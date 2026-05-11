import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gcuf.lostfound',
  appName: 'GCUF Lost & Found',
  webDir: 'public',
  server: {
    url: 'https://gcuf-lost-found-portal.vercel.app/',
    cleartext: true
  }
};

export default config;
