// Please also update config-schema.json
export type Config = {
  outDir: string;
  publicDir?: string;
  poweredBy?: boolean;
  favicon?: string;
  profilePicture: string;
  name: string;
  links: {
    title: string;
    url: string;
  }[];
};

const DEFAULT_CONFIG: Partial<Config> = {
  poweredBy: true,
};

export const parseConfig = (
  c: unknown,
): {
  success: true;
  config: Config;
} | {
  success: false;
  reasons: string[];
} => {
  const reasons: string[] = [];

  if (typeof c !== "object" || c === null) {
    return { success: false, reasons: ["Config must be an object."] };
  }

  const config: Partial<Config> = {
    ...DEFAULT_CONFIG,
    ...c,
  };

  if (typeof config.outDir !== "string") {
    reasons.push("%coutDir%c must be a string.");
  }

  if ("publicDir" in config && typeof config.publicDir !== "string") {
    reasons.push("%cpublicDir%c must be a string when defined.");
  }

  if ("poweredBy" in config && typeof config.poweredBy !== "boolean") {
    reasons.push("%cpoweredBy%c must be a string when defined.");
  }

  if (typeof config.profilePicture !== "string") {
    reasons.push("%cprofilePicture%c must be a string.");
  }

  if (typeof config.name !== "string") {
    reasons.push("%cname%c must be a string.");
  }

  if (!Array.isArray(config.links)) {
    reasons.push("%clinks%c must be an array.");
  } else {
    config.links.forEach((link, index) => {
      if (typeof link !== "object" || link === null) {
        reasons.push(`%clinks[${index}]%c must be an object.`);
      } else {
        if (typeof link.title !== "string") {
          reasons.push(`%clinks[${index}].title%c must be a string.`);
        }
        if (typeof link.url !== "string") {
          reasons.push(`%clinks[${index}].url%c must be a string.`);
        }
      }
    });
  }

  return reasons.length > 0
    ? { success: false, reasons }
    : { success: true, config: config as Config };
};
