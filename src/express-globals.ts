declare module "express-serve-static-core" {
  interface Request {
    user?: { aud: string };
  }
}

export {};
