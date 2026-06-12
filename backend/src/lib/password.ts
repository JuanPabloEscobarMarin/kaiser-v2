import bcrypt from "bcryptjs";

const ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);

export const verifyPassword = (plain: string, hashed: string) =>
  bcrypt.compare(plain, hashed);
