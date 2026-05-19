import express from "express";
import createError from "http-errors";
import { PrismaClient } from "@prisma/client";

import "./express-globals.js";

import { errorHandler } from "./errors/error-handler.js";
import { FriendRequestController } from "./controllers/friend-request.controller.js";
import { FriendsController } from "./controllers/friends.controller.js";
import { PrismaFriendRequestRepository } from "./repositories/friend-request.repository.js";
import { PrismaFriendsRepository } from "./repositories/friends.repository.js";
import { PrismaFriendRankerRepository } from "./repositories/friend-ranker.repository.js";
import { DefaultFriendRequestService } from "./services/friend-request.service.js";
import { DefaultFriendsService } from "./services/friends.service.js";
import { FriendRankerService } from "./services/friend-ranker.service.js";
import { PrismaUserRepository } from "./repositories/user.repository.js";
import { DefaultUserService } from "./services/user.service.js";
import { createV1Router } from "./routes/v1/index.js";
import { startConsumers, stopConsumers } from "./kafka/consumer.js";

const prisma = new PrismaClient();

// Dependency Injection
const friendRequestRepository = new PrismaFriendRequestRepository(prisma);
const friendRankerRepository = new PrismaFriendRankerRepository(prisma);
const friendRankerService = new FriendRankerService(friendRankerRepository);
const friendRequestService = new DefaultFriendRequestService(
  friendRequestRepository,
  friendRankerService,
);
const friendRequestController = new FriendRequestController(friendRequestService);

const friendsRepository = new PrismaFriendsRepository(prisma);
const friendsService = new DefaultFriendsService(friendsRepository);
const friendsController = new FriendsController(friendsService);

const userRepository = new PrismaUserRepository(prisma);
const userService = new DefaultUserService(userRepository);

const app = express();

app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", createV1Router(friendRequestController, friendsController));

app.use((_req, _res, next) => {
  next(createError(404, "Route not found"));
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 4042;

const server = app.listen(port, () => {
  console.log(`Friends service running on port ${port}`);
  // Kafka: consume post and user events in parallel (non-blocking errors).
  void startConsumers(friendRankerService, userService).catch((err: unknown) =>
    console.error("Kafka consumers:", err),
  );
});

async function shutdown(): Promise<void> {
  await stopConsumers().catch(() => undefined);
  await prisma.$disconnect();

  server.close(() => {
    process.exit(0);
  });
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
