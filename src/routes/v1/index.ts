import { Router } from "express";
import type { FriendRequestController } from "../../controllers/friend-request.controller.js";
import { createFriendRequestsRouter } from "./friend-requests.routes.js";

export function createV1Router(friendRequestController: FriendRequestController): Router {
  const router = Router();
  router.use("/friend-requests", createFriendRequestsRouter(friendRequestController));
  return router;
}
