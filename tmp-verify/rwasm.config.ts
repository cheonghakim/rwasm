import { defineConfig } from '@cheonghakim/rwasm';

export default defineConfig({
  crate: './rust',
  target: 'web',
  profile: 'release',
});
