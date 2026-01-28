import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
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

    const {username, fullName, email, password} = req.body //1
    console.log("email:", email);

    if (  //2
        [username, fullName, email, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required")
    }

    const existedUser = await User.findOne({ //3
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with username or email already eixst")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; //4
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
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

    if(!createdUser) { //8
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    return res.status(201).json(  //9
        new ApiResponse(200, createdUser, "User registered successfully")
    )

});

export default registerUser;