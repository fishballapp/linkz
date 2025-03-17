export const parseTitle = (md: string): undefined | string =>
  md.match(/^# (.*?)$/usm)?.[1];
