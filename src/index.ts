import { PrismaClient } from "@prisma/client";
import express, { Request, Response, response } from "express";
import createError from "http-errors";
import * as dotenv from "dotenv";
import * as winston from "winston";
import { randomUUID } from "crypto";
import moment from "moment";

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
app.post(
  "/users/topup",
  async (req: Request, res: Response, next: Function) => {
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

      logger.info(`Success TopUp user`);
      res.json({ data: updated });
    } catch (e) {
      logger.error(`Error TopUp User`);

      next(createError.NotFound());
    }
  }
);
app.post(
  "/users/detail",
  async (req: Request, res: Response, next: Function) => {
    const { email } = req.body;
    logger.info(`Getting user details of ${email}`);
    try {
      const user = await prisma.user.findFirstOrThrow({
        where: {
          email,
        },
      });
      logger.info("Success getting user detail");
      res.json({
        data: user,
      });
    } catch (e) {
      logger.error(`Error Getting User Detail`);

      next(createError.NotFound());
    }
  }
);

// 2. Auth
app.post("/pin/create", async (req: Request, res: Response) => {
  const { email, pin } = req.body;

  logger.info(`Creating pin for user ${email}`);
  try {
    const updatePin = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        pin: pin,
      },
    });

    logger.info(`Success creating pin`);
    res.json({ data: updatePin });
  } catch (e) {
    logger.error(`Error Creating Pin`);
    res.json(createError.NotFound());
  }
});
app.post(
  "/pin/validate",
  async (req: Request, res: Response, next: Function) => {
    try {
      const { email, pin } = req.body;
      logger.info("Validating user pin");
      const validate = await prisma.user.findFirstOrThrow({
        where: {
          email: email,
        },
      });
      if (validate.pin === pin) {
        logger.info("Pin Validated");
        return res.json({
          data: {
            validate: true,
          },
        });
      }
      logger.info("Pin Not Valid");
      next(createError.Unauthorized("Invalid Pin"));
    } catch (e) {
      logger.error(`Error Validate Pin`);
      next(createError.NotFound());
    }
  }
);
app.post(
  "/pin/biometric",
  async (req: Request, res: Response, next: Function) => {
    try {
      const { email, enabled } = req.body;
      logger.info(`Set biometric status for user ${email}`);
      const user = await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          isBiometricOn: enabled,
        },
      });

      logger.info(`Success set biometric status to ${enabled}`);
      res.json({
        data: user,
      });
    } catch (_) {
      next(createError.NotFound());
    }
  }
);

// 3. Station
app.post(`/stations`, async (req: Request, res: Response, next: Function) => {
  const { code, name } = req.body;
  logger.info(`Creating station with name: ${name}`);

  try {
    const station = await prisma.station.create({
      data: {
        id: randomUUID(),
        code: code,
        name: name,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString(),
      },
    });
    logger.info("Success adding station");
    res.json({ data: station });
  } catch (e) {
    logger.error(e);
    next(createError.BadRequest());
  }
});
app.get("/stations", async (req: Request, res: Response, next: Function) => {
  const station = await prisma.station.findMany({
    include: {
      device: true,
    },
  });

  res.json({ data: station });
});
app.post(
  `/stations/fare`,
  async (req: Request, res: Response, next: Function) => {
    const { from, to, fare } = req.body;
    logger.info(`Adding fare from ${from} to ${to} with amount ${fare}`);

    try {
      const station = await prisma.fare.create({
        data: {
          fare: fare,
          startStationId: from,
          endStationId: to,
        },
      });

      logger.info(`Success adding fare`);

      res.json({ data: station });
    } catch (e) {
      logger.error(e);
      next(createError.NotFound());
    }
  }
);

// 4. Device
app.post(`/devices`, async (req: Request, res: Response, next: Function) => {
  const { hwid, status, stationId, code, gate } = req.body;
  logger.info(
    `Adding device ${code} of gate ${gate} into station ${stationId}`
  );

  try {
    const device = await prisma.device.create({
      data: {
        id: randomUUID(),
        hwid: hwid,
        status: status,
        stationId: stationId,
        code: code,
        gate: gate,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString(),
      },
    });

    logger.info(`Success adding device ${device.code}`);
    res.json({ data: device });
  } catch (e) {
    logger.error(e);
    next(createError.BadRequest());
  }
});
// 5. Transaction
app.post(
  `/transactions`,
  async (req: Request, res: Response, next: Function) => {
    const {
      email,
      checkInStation,
      checkInGate,
      checkoutStation,
      checkoutGate,
    } = req.body;

    let isCheckOut = false;
    if (checkoutStation || checkoutGate) {
      isCheckOut = true;
    }
    logger.info(`Creating transaction: ${isCheckOut ? "CheckIn" : "CheckOut"}`);

    let now = moment();
    try {
      const user = await prisma.user.findFirstOrThrow({
        where: {
          email: email,
        },
      });

      if (user.balance.toNumber() > 50000.0) {
        throw new Error("Balance not exceed minimum requirement");
      }
      if (isCheckOut) {
        // Checkout Sequence

        const fare = await prisma.fare.findFirstOrThrow({
          where: {
            startStationId: checkInStation,
            endStationId: checkoutStation,
          },
        });

        const balance = user.balance.toNumber() - fare.fare.toNumber();

        const currentTransaction = await prisma.transaction.findFirstOrThrow({
          where: {
            userId: user.id,
            status: 1,
            checkInStationId: checkInStation,
          },
          orderBy: {
            checkIn: "desc",
          },
          take: 1,
        });
        const transaction = await prisma.transaction.update({
          where: {
            id: currentTransaction.id,
          },
          data: {
            status: 2,
            amount: fare.fare,
            checkOutStationId: checkoutStation,
            checkOutGateId: checkoutGate,
          },
        });

        const updatedUser = await prisma.user.update({
          where: {
            email: email,
          },
          data: {
            balance: balance,
          },
        });

        res.json({ data: transaction });
      } else {
        // Checkin Sequence
        const transaction = await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            checkInGateId: checkInGate,
            checkInStationId: checkInStation,
            checkIn: now.toISOString(),
            status: 0,
          },
        });
        res.json({ data: transaction });
      }
    } catch (e) {
      logger.error(e);
      next(createError.BadRequest());
    }
  }
);
app.get(
  `/transactions`,
  async (req: Request, res: Response, next: Function) => {
    const { email } = req.body;
    logger.info(`Get user transaction data`);
    const transaction = await prisma.transaction.findMany({
      include: {
        checkInStation: true,
        checkOutStation: true,
        checkInGate: true,
        checkOutGate: true,
      },
      where: {
        user: {
          email: email,
        },
      },
      orderBy: {
        checkIn: "desc",
      },
    });
    logger.info(`Success user transaction data`);

    res.json({ data: transaction });
  }
);
app.post(
  `/transactions/verify`,
  async (req: Request, res: Response, next: Function) => {
    const { transactionId } = req.body;
    logger.info(`Validate transaction ${transactionId}`);

    try {
      const transaction = await prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          status: 1,
        },
      });

      res.json({ data: transaction });
    } catch (e) {
      logger.error(e);
      next(createError.BadRequest());
    }
  }
);
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
