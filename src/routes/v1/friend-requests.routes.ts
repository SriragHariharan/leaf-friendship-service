import { Router } from "express";
import type { FriendRequestController } from "../../controllers/friend-request.controller.js";

export function createFriendRequestsRouter(controller: FriendRequestController): Router {
  const router = Router();

  router.get("/", controller.listIncomingPending);
  router.post("/:friendId", controller.sendFriendRequest);
  router.patch("/:friendRequestId", controller.patchFriendRequestStatus);

  return router;
}
