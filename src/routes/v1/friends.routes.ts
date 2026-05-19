import { Router } from "express";
import type { FriendsController } from "../../controllers/friends.controller.js";
import { validateAccessToken } from "../../middleware/validate-access-token.js";

export function friendsRouter(controller: FriendsController): Router {
  const router = Router();

  // Fanout service: no JWT; pass ?userId=
  router.get("/top-friend-ids", controller.getTopFriendIds);

  router.use(validateAccessToken);

  router.get("/", controller.getFriends);
  router.delete("/:friendId", controller.unfriend);

  return router;
}
