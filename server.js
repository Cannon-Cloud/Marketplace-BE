import express from "express";
import { readdirSync } from "fs";
import cors from "cors";
import mongoose from "mongoose";
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//Database Connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("DB Connection Error: ", err));

// Establish routes
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

//Setup Server
const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
