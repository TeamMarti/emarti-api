import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"
import * as dotenv from "dotenv";
import { createUser } from "./controllers/user/UserController";


dotenv.config()
const prisma = new PrismaClient()

const app = express()

app.use(express.json())

//TODO: Routing Apps

app.post("/users", createUser)
app.post("")
// handle 404
app.use((req: Request, res: Response, next: Function) => {
  next(createError.NotFound("Route Not Found"))
})

app.use((err: any, req: Request, res: Response, next: Function) => {
  res.status(err.status || 500).json({
        status: false,
        message: err.message
    })
})

app.listen(process.env.APP_PORT, () => {
  console.log("⚡️[server]: Emarti Api is running at port 3000 🚀")
})