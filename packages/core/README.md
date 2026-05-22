# @linksite/core

Programmatic API powering the [`linksite`](https://www.npmjs.com/package/linksite) CLI.

```ts
import { buildSite, loadConfig } from '@linksite/core';

const config = await loadConfig('./linksite.config.json');
const { files } = await buildSite(config, { cwd: process.cwd() });
```

See https://linksite.fishball.app/usage for full documentation.
