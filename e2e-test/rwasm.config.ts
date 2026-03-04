import { defineConfig } from 'rwasm';

export default defineConfig({
  crate: './rust',
  target: 'web',
  profile: 'release',
});
