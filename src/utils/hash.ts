import bcrypt from 'bcryptjs';

export const hash = (password: string): Promise<string> => bcrypt.hash(password, 12);
export const compare = (password: string, passwordHash: string): Promise<boolean> =>
  bcrypt.compare(password, passwordHash);
