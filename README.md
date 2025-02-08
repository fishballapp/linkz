# Linkz

A command-line tool to generate your own "linktree-like" website.

<img src="./public/logo.png" alt="logo" width="250">

## Easy as 1, 2, 3...

1. Create a config (see [example](./linkz.config.json))
   ```json
   {
     "$schema": "https://linkz.fishball.app/config-schema.json",
     "outDir": "dist",
     "publicDir": "public",
     "profilePicture": "logo.png",
     "name": "Linkz",
     "links": [
       {
         "title": "Github",
         "url": "https://github.com/fishballapp/linkz"
       },
       {
         "title": "JSR",
         "url": "https://jsr.io/@fishballpkg/linkz"
       }
     ]
   }
   ```
2. Build the website
   ```bash
   deno run jsr:@fishballpkg/linkz path/to/your/linkz.config.json
   ```
3. Deploy `dist` or whatever directory you specify in your `config.outDir`!

## Author

YCM Jason
