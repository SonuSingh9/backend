import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
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



export { registerUser }