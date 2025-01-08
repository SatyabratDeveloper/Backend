import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  const { username, email, fullname, password } = req.body;

  // validation
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "All fields are required.");
  }

  // check if user already exists
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new APIError(409, "User with this username or email already exists");
  }

  // check for images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = "";

  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar file is required");
  }

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // upload images to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // check images uploaded successfully on cloudinary
  if (!avatar) {
    throw new APIError(400, "Try again, Avatar file is required");
  }

  // create user object in db - create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // check if user is created in db and remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new APIError(500, "Something went wrong while registering the user");
  }

  // if db created successfully, return response
  return res
    .status(201)
    .json(new APIResponse(200, createdUser, "User registered successfully"));
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    // find the user by its id
    const user = await User.findById(userId);

    // generate access and refresh token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save the refreshToken to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong, while generating access and refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  const { username, email, password } = req.body;

  // validation
  if (!(username || email)) {
    throw new APIError(400, "Username or Email is required");
  }

  if (!password) {
    throw new APIError(400, "Password is required");
  }

  // query to mongoDB with the username or email, if user not found throw error
  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new APIError(
      404,
      "User not found with this username or email. Please try again with correct username or email."
    );
  }

  // check password, if password is incorrect throw error
  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new APIError(401, "Password is invalid.");
  }

  // generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // update user because refresh token is not update here in user
  // we can query in DB or update the user object to update refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookies and return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshTokenReceived =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshTokenReceived) {
    throw new APIError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      refreshTokenReceived,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedRefreshToken) {
      throw new APIError(401, "Unauthorized request");
    }

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new APIError(401, "Invalid refresh token");
    }

    if (decodedRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new APIResponse(
          200,
          { accessToken, refreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new APIError(
      401,
      error.message || "Something went wrong while refreshing access token"
    );
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
