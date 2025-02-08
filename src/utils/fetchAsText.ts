export const fetchAsText = async (
  url: string,
  { trim = false }: { trim?: boolean } = {},
): Promise<string> => {
  const res = await fetch(url);
  const text = await res.text();
  return trim ? text.trim() : text;
};
