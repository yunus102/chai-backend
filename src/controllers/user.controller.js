import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
 
const generateAccessAndRefereshTokens = async (userId)=>{
    try {
         const user = await User.findById(userId);
         const accessToken = user.generateAccessToken();
         const refreshToken = user.generateRefreshToken();
         
         user.refreshToken = refreshToken
         await user.save({ validateBeforeSave : false })

         return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

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

    if (req.files && Array.isArray(req.files) && 
    req.files.coverImage.length> 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

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

const loginUser = asyncHandler(async (req, res)=>{
    //get user credentials via params
    //validate the user inputs
    //check credentials in db
    //if it match's return Access, Refresh token
    //if not return respective error
    // send cookies

    const {email, username, password} = req.body

    if (!username || !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await new user.isPasswordCorret(password)
    
    if (!isPasswordValid) {
        throw new ApiError(401, "Username or password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res)=>{
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
    .json(new ApiResponse(200, {}, "User logout"))
})

export { 
    registerUser,
    loginUser,
    logoutUser 
 }