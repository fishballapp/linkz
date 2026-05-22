export const isFullUrl = (href: string): boolean => /^(https?|mailto):/i.test(href);
