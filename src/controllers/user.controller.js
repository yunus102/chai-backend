import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
 
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body

    if(
        [fullname, email, username, password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }
    //console.log(req.files.avatar[0]);
    const avatarLocalPath =  req.files?.avatar[0]?.path;
   // const coverImageLocalPath =  req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    let coverImage ;

    if (req.files && Array.isArray(req.files) && 
    req.files.coverImage.length> 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }
    console.log(coverImage)
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar image is requried")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went error while registering a user"
            )
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})



export { registerUser }