import { User } from "../models/user.model.js";
import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // get accessToken from cookie or header
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new APIError(401, "Unauthorized request");
    }

    // verify token from jwt - decoded token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // get user by DB query
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new APIError(401, "Invalid access token");
    }

    // add user to req
    req.user = user;
    next();
  } catch (error) {
    throw new APIError(401, error.message || "Invalid access token");
  }
});

export { verifyJWT };
