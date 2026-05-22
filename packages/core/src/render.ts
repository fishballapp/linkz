export const render = (html: string, variables: Record<string, string>): string => {
  return html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? '');
};
