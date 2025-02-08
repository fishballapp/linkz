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
          `%cCannot find "${key}". Will use empty string instead`,
          "color: yellow;",
        );
      }
      return value ?? "";
    },
  );
};
