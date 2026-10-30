import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ref } from "process"
import jwt from "jsonwebtoken"
import { verify } from "crypto"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong while generating assess and refresg token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, userName, password } = req.body
    console.log("email", email)
    console.log("password", password)

    // if (fullname === "") {
    //     throw new ApiError(400, "Fullname is required")
    // }
    if (
        [fullName, email, userName, password].some(feilds => feilds?.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }

    const existedUer = await User.findOne({ $or: [{ userName }, { email }] })
    //console.log(existedUer);
    if (existedUer) {
        throw new ApiError(409, "User alreday existed")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    console.log(avatarLocalPath)

    //const coverImagePath = req.files?.coverImage?.[0]?.path
    //console.log(coverImagePath)

    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalpath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        userName,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body

    if (!email && !userName) {
        throw new ApiError(404, "email or username is reuired")
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(404, "Password is incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    },
        "User logged in successfully"
    ))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "Userlogged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshAccessToken) {
        throw new ApiError(401, "unauthorize request")
    }

    try {
        const decodedTeokn = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedTeokn?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refreshToken")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(402, error?.message || "Invalid refresh token")
    }
})



export { registerUser, loginUser, logoutUser, refreshAccessToken }