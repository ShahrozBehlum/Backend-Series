
import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/db.js";

dotenv.config({
    path: './env'
})

connectDB();











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
