# Usage

Linkz is a simple config-based static site generator.

The aim is to generate a linktree-like website based on a configuration allowing
you to deploy within minutes.

## Easy as 1, 2, 3...

1. Create a config (see
   [example](https://github.com/fishballapp/linkz/blob/main/linkz.config.json))
   ```jsonc
   {
     "$schema": "https://linkz.fishball.app/config-schema.json",
     "outDir": "dist",
     "publicDir": "public",

     // favicon / profilePicture are relative from `publicDir` or a url
     "favicon": "logo.png",
     "profilePicture": "logo.png",

     "name": "Linkz",
     "links": [
       {
         "title": "Usage",
         "href": "/usage" // points to ./public/usage.md
       },
       {
         "title": "Github",
         "href": "https://github.com/fishballapp/linkz"
       },
       {
         "title": "JSR",
         "href": "https://jsr.io/@fishballpkg/linkz"
       }
     ]
   }
   ```
2. Build the website
   ```bash
   deno run jsr:@fishballpkg/linkz path/to/your/linkz.config.json
   ```
   Or if you wish to specify the minimal permission predefined:
   ```bash
   deno run \
     --allow-net=jsr.io \
     --allow-write=dist \
     --allow-read=. \
     jsr:@fishballpkg/linkz \
     ./path/to/your/linkz.config.json
   ```
3. Deploy `dist` or whatever directory you specify in your `config.outDir`!

Check out our
[continuous deployment](https://github.com/fishballapp/linkz/blob/main/.github/workflows/deploy-website.yml)
for inspiration too!

## Reference Projects

Here are some open-source websites using Linkz which might give you some
inspiration on how to use Linkz:

- linkz.fishball.app [[Github]](https://github.com/fishballapp/linkz)
- fishball.app [[Github]](https://github.com/fishballapp/fishball.app)
- ycmjason.com [[Github]](https://github.com/ycmjason/ycmjason.com)
