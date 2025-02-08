export const help = () => {
  console.log(
    `
  %cLinkz - Generate a Linktree-like static website

  %cUsage:
    %clinkz path/to/config.json

  %cDescription:
    Generates a simple static website based on a JSON configuration file.

  %cExample:
    %clinkz links.json

  %cConfiguration File:
    The JSON file should contain an array of links with titles and URLs.

  %c⭐️ on Github:
    https://github.com/fishballapp/linkz
  `,
    "color: cyan; font-weight: bold;",
    "color: yellow; font-weight: bold;",
    "color: white;",
    "color: yellow; font-weight: bold;",
    "color: white;",
    "color: white;",
    "color: yellow; font-weight: bold;",
    "color: white;",
  );
};
