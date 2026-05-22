# Usage

Linksite is a simple config-based static site generator.

The aim is to generate a linktree-like website based on a configuration allowing
you to deploy within minutes.

## Easy as 1, 2, 3...

1. Create a config (see
   [example](https://github.com/fishballapp/linksite/blob/main/apps/website/linksite.config.json))
   ```jsonc
   {
     "$schema": "https://linksite.fishball.app/config-schema.json",
     "outDir": "dist",
     "publicDir": "public",

     // favicon / profilePicture are relative from `publicDir` or a url
     "favicon": "logo.png",
     "profilePicture": "logo.png",

     "name": "Linksite",
     "links": [
       {
         "title": "Usage",
         "href": "/usage" // points to ./public/usage.md
       },
       {
         "title": "Github",
         "href": "https://github.com/fishballapp/linksite"
       },
       {
         "title": "npm",
         "href": "https://www.npmjs.com/package/linksite"
       }
     ]
   }
   ```
2. Build the website
   ```bash
   npx linksite build path/to/your/linksite.config.json
   ```
3. Deploy `dist` (or whatever you set in `config.outDir`)!

Check out our
[continuous deployment](https://github.com/fishballapp/linksite/blob/main/.github/workflows/deploy-website.yml)
for inspiration too!

## Reference Projects

Here are some open-source websites using Linksite which might give you some
inspiration on how to use it:

- linksite.fishball.app [[Github]](https://github.com/fishballapp/linksite)
- fishball.app [[Github]](https://github.com/fishballapp/fishball.app)
- ycmjason.com [[Github]](https://github.com/ycmjason/ycmjason.com)
