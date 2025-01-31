//require('dotenv').config({path: '/.env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config(
    {path: './.env'}
)

connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log("App Error : ", err)
    })
    
    app.listen(process.env.PORT || 8000, ()=>
        { console.log(`Server Running at ${process.env.PORT}`) })
})
.catch((err)=>{
    console.log("MONGODB error : ", err)
})

// Below is 1 aproach to connect db
/* 
import express from "express";
const app = express()

;(async () => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("errr :", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App listening on port ${process.env.PORT}`)
        })
    } catch (error){
        console.error("error :", error)
        throw err
    }
})()
*/