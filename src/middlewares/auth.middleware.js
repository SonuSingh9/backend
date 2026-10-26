import { ApiError } from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || res.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(404, "Unauthorized request")
        }

        const decodeToekn = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToekn?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(404, "Invalid access token")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})