import { Router } from "express";
import type { FriendsController } from "../../controllers/friends.controller.js";

export function friendsRouter(controller: FriendsController): Router {
  const router = Router();

  router.get("/", controller.getFriends.bind(controller));
  router.get("/top-friend-ids", controller.getTopFriendIds.bind(controller));
  router.delete("/:friendId", controller.unfriend.bind(controller));

  return router;
}
