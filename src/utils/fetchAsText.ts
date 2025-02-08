export const fetchAsText = async (url: string): Promise<string> => {
  const res = await fetch(url);
  return await res.text();
};
