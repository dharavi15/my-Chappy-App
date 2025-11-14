import jwt from "jsonwebtoken";

export function generateToken(username: string) {
  return jwt.sign(
    { username },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (_err) {
    return null;
  }
}
