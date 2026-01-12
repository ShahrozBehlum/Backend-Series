//reaper function we use it where we need like in res route
const asyncHandler = (requestHandler) => {  //1
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}


export default asyncHandler;








//reaper function we use it where we need
/*const asyncHandler = (fn) => async (req, res, next) => {  //2
    try {
        await fn(req, res, next)

    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}*/