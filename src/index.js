//require('dotenv').config({path: './env'})

import dotenv from 'dotenv';


import express from "express";
import connectDB from './db/index.js';
const app = express();

dotenv.config({
    path: './env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 3030, () => {
        console.log(`Server is running on port : ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("MONGODB connection failed !!!", error);
    
})














// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", () => {
//             console.log("ERROR:", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listining on port${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.error('ERROR: ', error)
//         throw err
//     }
// })()