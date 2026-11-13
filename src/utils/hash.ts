import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hash = (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const compare = (password: string, passwordHash: string): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
