// using promises

const asyncHandler = (reqestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(reqestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



// using async await and try catch 

// const asyncHandler =(fn)=> async (req,res,next)=>{
//     try {

//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

export {asyncHandler}