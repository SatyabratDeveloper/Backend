import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import APIError from "../utils/ApiError.js";
import APIResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  // get video (multer)
  const videoPath = req.file?.path;

  if (!videoPath) {
    throw new APIError(400, "Video file is required");
  }

  // upload to cloudinary
  const video = await uploadOnCloudinary(videoPath);

  if (!video) {
    throw new APIError(500, "Video is not uploaded on cloudinary");
  }

  console.log("uploadOnCloudinary video:", video);
  console.log(req.user);

  // create Video object on DB
  const publishUserVideo = await Video.create({
    videoFile: video.url,
    thumbnail: video.url,
    title,
    description,
    duration: video.duration,
    views: 0,
    owner: await User.findById(req.user._id),
    isPublished: true,
  });

  if (!publishUserVideo) {
    throw new APIError(500, "Video is not uploaded on DB");
  }

  return res
    .status(200)
    .json(
      new APIResponse(200, publishUserVideo, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
