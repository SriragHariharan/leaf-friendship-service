import { Router } from "express";
import type { FriendRequestController } from "../../controllers/friend-request.controller.js";
import type { FriendsController } from "../../controllers/friends.controller.js";
import { createFriendRequestsRouter } from "./friend-requests.routes.js";
import { friendsRouter } from "./friends.routes.js";

export function createV1Router(
  friendRequestController: FriendRequestController,
  friendsController: FriendsController,
): Router {
  const router = Router();
  router.use("/friend-requests", createFriendRequestsRouter(friendRequestController));
  router.use("/friends", friendsRouter(friendsController));
  return router;
}
