export const parseTitle = (md: string): undefined | string => md.match(/^# (.*?)$/msu)?.[1];
