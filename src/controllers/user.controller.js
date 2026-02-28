import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, error.message, "Something went wrong while generating access and refreesh token")
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //Algorithm
    // get user detail from frontend
    // validation - not empty
    // check if user already exist by username or email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from res
    // check for user creation
    // return res

    const { username, fullName, email, password } = req.body //1
    // console.log("email:", email);

    if (  //2
        [username, fullName, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required")
    }

    const existedUser = await User.findOne({ //3
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with username or email already eixst")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path; //4
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (
        req.files &&
        req.files.coverImage &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) //5
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({  //6
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(  //7
        "-password -refreshToken"
    )

    if (!createdUser) { //8
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    return res.status(201).json(  //9
        new ApiResponse(200, createdUser, "User registered successfully")
    )

});

const loginUser = asyncHandler(async (req, res) => {
    //req body => data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    };

    const user = await User.findOne(
        {
            $or: [{ email }, { username }]
        }
    );

    if (!user) {
        throw new ApiError(400, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrected(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(  //7
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully")
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out")
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const upcommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!upcommingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(upcommingRefreshToken, REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id);
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (upcommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {refreshToken: newRefreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access token refreshed")
            ); 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword, confirmPassword} = req.body;

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Password not matched")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrected = user.isPasswordCorrected(oldPassword);

    if(!isPasswordCorrected) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200, "", "Password change successfully")
    )
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched sucessfully")
    )
});

const updateAccountDetail = asyncHandler( async (req, res) => {

    const {fullName, email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email:  email
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Account details changed successfully")
    )
});

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;


    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatat: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar update successfully")
    )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;


    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover Image")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image update successfully")
    )
});

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const {username} = req.params;

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channal = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",   //otherCollection
                localField: "_id",       //fieldInThisCollection
                foreignField: "channel", //fieldInOtherCollection
                as: "subscribers"        //newArrayField
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channalSubscribesToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channalSubscribesToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1  
            }
        }
    ])

    if(!channel?.lenght) {
        throw new ApiError(400, "channal does not exists")
    }

    return res.status(200).json(
        new ApiResponse(200, channal[0], "User channel fetched successfully")
    ) 
});

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: 'watchHistory',
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, user[0].getWatchHistory, "Watch history fetched successfully")
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetail, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };