import jwt, { SignOptions } from "jsonwebtoken"

export function signJwt(
  payload: object,
  options?: SignOptions
): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    { expiresIn: "12h", ...(options ?? {}) }
  )
}

export function verifyJwt<T = any>(token: string): T {
  return jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as T
}
