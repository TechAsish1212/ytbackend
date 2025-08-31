import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

// register
const registerUser = asyncHandler(async (req, res) => {
    // 1. get user details from frontend
    const { email, username, password, fullName } = req.body;
    // console.log("Email : ", email)

    // 2. validation - not empty
    // optional method

    if ([email, username, password, fullName].some((i) => i?.trim === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // another method
    // if (fullName === "") {
    //     throw new ApiError(400, "Fullname is required");
    // }
    // else if (username === "") {
    //     throw new ApiError(400, "Username is required");
    // }
    // else if (fullName === "") {
    //     throw new ApiError(400, "fullname is required");
    // }
    // else if (password === "") {
    //     throw new ApiError(400, "password is required");
    // }

    // 3. check if user already exists or not (username,email)
    // one process (you can choose this)

    // const existEmail = User.findOne({ email });
    // if (existEmail) {
    //     throw new ApiError(400, "User already exists")
    // }

    // another process (optimal)
    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existUser) {
        throw new ApiError(409, "User already exists");
    }

    // 4. check for images,check for avatar 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 5. upload them to cloudinary ,avatar
    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 6. create user object  -  create empty in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7. remove password and refresh token field from response 
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check for user creation
    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered Successfully")
    )
})

// Login
const loginUser = asyncHandler(async (req, res) => {
    // 1. take the data from user
    const { email, username, password } = req.body;

    // 2. username or email base login
    if (!username || !email) {
        throw new ApiError(400, "Email or Username is required");
    }

    // 3. find the user base on username or email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!existedUser) {
        throw new ApiError(400, "Username or email does not exists");
    }

    // 4. password checking
    const passwordValid = await existedUser.isPasswordCorrect(password);

    if (!passwordValid) {
        throw new ApiError(400, "Incorrect Password");
    }

    // 5. access and refresh token send to the user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(existedUser._id);

    // 6. send cookie
    const loggedInUser = await User.findById(existedUser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken },"User logged In Successfully"))
})


export { registerUser,loginUser }