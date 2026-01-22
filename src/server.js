import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

import transactionsRoute from "./routes/transactionsRoute.js";
import servicesRoute from "./routes/servicesRoute.js";
dotenv.config();

const app = express();

// midlleware
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use("/api/transactions", transactionsRoute);
app.use("/api/services", servicesRoute);


initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is up and running on PORT : " + PORT);
    });
})