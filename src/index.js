
import dotenv from "dotenv";
import connectDB from "./db/db.js";


dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("DB not working", error);
        throw error;
    })
    app.listen(port, () => {
        console.log(`server is running at port: ${port}`);
    })
})
.catch((err) => {
    console.log("DB Connection Failed!!", err);  
})











/*
const app = express();
const port = process.env.PORT;

(async () => {
    try {
        await mongoose(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log(error);
            throw error
        })

        app.listen(port, () => {
        console.log("Server Started");
    
})

    } catch (error) {
        console.error("Error: ", error)
        throw error
    }
})()
*/
