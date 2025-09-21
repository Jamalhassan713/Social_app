import mongoose from "mongoose";

export async function dbConnection() {
    try {
        await mongoose.connect(process.env.DB_URL_LOCAL as string)
        console.log(`Database connected`);
        
    } catch (error) {
        console.log(`Error connection to the database: ${error}`);
    }
}