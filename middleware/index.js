import expressJwt from "express-jwt";

export const requireSignin = expressJwt({
  // secret and expirary
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});
