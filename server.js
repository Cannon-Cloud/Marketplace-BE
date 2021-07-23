import express from "express";
import { readdirSync } from "fs";

const app = express();

readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

app.listen(8000, () => console.log(`Server is running on port 8000`));
