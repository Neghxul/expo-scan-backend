import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    // Forzamos "any" para que TS no se pelee con los tipos exactos de la librería
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}