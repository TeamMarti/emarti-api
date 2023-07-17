import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors";
import * as dotenv from "dotenv";
import * as winston from "winston";
import { randomUUID } from "crypto";
import moment from "moment";
import { timeStamp } from "console";

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  defaultMeta: { service: "emarti-api" },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

dotenv.config();
const prisma = new PrismaClient();

const app = express();

app.use(express.json());

//TODO: Routing Apps

// 1. Users
app.get("/users", async (req: Request, res: Response) => {
  logger.info("Get all users");
  const user = await prisma.user.findMany();
  logger.info("Users got");
  res.json({
    data: user,
  });
});
app.post("/users", async (req: Request, res: Response) => {
  logger.info("Creating User");
  const { email, name, pin, balance } = req.body;
  logger.debug(req.body);
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: email,
      name: name,
      pin: pin,
      balance: balance,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
      isBiometricOn: false,
    },
  });
  logger.info("Success creating user");

  res.json({ data: user });
});
app.post("/users/topup", async (req: Request, res: Response) => {
  const { email, amount } = req.body;
  logger.info(`Updating user ${email} balance with amount ${amount}`);
  try {
    const currentUser = await prisma.user.findFirstOrThrow({
      where: {
        email: email,
      },
    });

    logger.info(`User Current Balance: ${currentUser.balance}`);
    const updated = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        balance: currentUser.balance + amount,
      },
    });

    res.json({ data: updated });
  } catch (e) {
    res.json(createError.NotFound);
  }
});
app.post("/users/detail", async (req: Request, res: Response) => {
  const { email } = req.body;
  logger.info(`Getting user details of ${email}`);
  try {
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email,
      },
    });
    res.json({
      data: user,
    });
  } catch (e) {
    res.json(createError.NotFound);
  }
});

//
// handle 404
app.use((req: Request, res: Response, next: Function) => {
  next(createError.NotFound("Route Not Found"));
});

app.use((err: any, req: Request, res: Response, next: Function) => {
  res.status(err.status || 500).json({
    status: false,
    message: err.message,
  });
});

app.listen(process.env.APP_PORT, () => {
  console.log("⚡️[server]: Emarti Api is running at port 3000 🚀");
});
