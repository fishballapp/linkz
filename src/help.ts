export const help = () => {
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const white = '\x1b[37m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';

  console.log(
    `
  ${cyan}${bold}Linkz - Generate a Linktree-like static website${reset}

  ${yellow}${bold}Usage:${reset}
    ${white}linkz path/to/config.json${reset}

  ${yellow}${bold}Description:${reset}
    Generates a simple static website based on a JSON configuration file.

  ${yellow}${bold}Example:${reset}
    ${white}linkz links.json${reset}

  ${yellow}${bold}Configuration File:${reset}
    The JSON file should contain an array of links with titles and URLs.

  ⭐️ on Github:
    https://github.com/fishballapp/linkz
  `,
  );
};
