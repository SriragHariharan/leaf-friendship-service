import { Router } from "express";
import type { FriendRequestController } from "../../controllers/friend-request.controller.js";
import { validateAccessToken } from "../../middleware/validate-access-token.js";

export function createFriendRequestsRouter(controller: FriendRequestController): Router {
  const router = Router();

  router.use(validateAccessToken);

  router.get("/relationship/:otherUserId", controller.getRelationship);
  router.get("/", controller.listIncomingPending);
  router.post("/:friendId", controller.sendFriendRequest);
  router.patch("/:friendRequestId", controller.patchFriendRequestStatus);

  return router;
}
