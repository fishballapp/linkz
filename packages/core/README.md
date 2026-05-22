# @linkly/core

Programmatic API powering the [`linkly`](https://www.npmjs.com/package/linkly) CLI.

```ts
import { buildSite, loadConfig } from '@linkly/core';

const config = await loadConfig('./linkly.config.json');
const { files } = await buildSite(config, { cwd: process.cwd() });
```

See https://linkly.fishball.app/usage for full documentation.
