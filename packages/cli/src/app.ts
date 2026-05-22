import { buildApplication, buildRouteMap } from '@stricli/core';
import pkg from '../package.json' with { type: 'json' };
import { buildSiteCommand } from './commands/build/command.ts';

const routes = buildRouteMap({
  routes: {
    build: buildSiteCommand,
  },
  docs: {
    brief: pkg.description,
  },
});

export const app = buildApplication(routes, {
  name: pkg.name,
  versionInfo: {
    currentVersion: pkg.version,
  },
});
