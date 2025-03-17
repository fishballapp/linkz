export const render = (
  html: string,
  variables: Record<string, string>,
): string => {
  return html.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key) => {
      const value = variables[key];
      if (typeof value === "undefined") {
        console.warn(
          `%cRender Warning:%c Cannot find %c${key}%c. Will use empty string instead`,
          "color: yellow;",
          "",
          "color: cyan;",
          "",
        );
      }
      return value ?? "";
    },
  );
};
