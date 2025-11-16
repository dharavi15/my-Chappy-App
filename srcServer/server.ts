import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import { logger } from "./middleware/logger.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import channelsRouter from "./routes/channels.js";
import messagesRouter from "./routes/messages.js";
import dmRouter from "./routes/dm.js";

const app: Express = express();  
const port: number = Number(process.env.PORT) || 1337;

app.use(cors());                 
app.use(express.static("./dist/"));
app.use(express.json());
app.use("/", logger);

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/dm", dmRouter);

app.listen(port, (error?: Error) => {
  if (error) {
    console.log("Server could not start!", error.message);
  } else {
    console.log(`Server is listening on port ${port}...`);
  }
});
