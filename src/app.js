import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; //from my server i set user cookie and also set 

const app = express();
const port = process.env.PORT;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(cookieParser())

//major configuration
app.use(express.json({limit: "10kb"}))  //middleware it take data from form 
app.use(express.urlencoded({extended: true, limit: "10kb"}))  // it take data from url & extented means use object inside another object
app.use(express.static("public")) // it make folder in my server public assets for storing pdf and file  


export default app;