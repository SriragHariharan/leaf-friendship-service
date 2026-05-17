import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import type { IUserService } from "../services/user.service.interface.js";
import { consumePostCommented, consumePostLiked, stopPostEventConsumers } from "./post-events.consumer.js";
import { consumeUserCreated, consumeUserUpdated, stopUserEventConsumers } from "./user-events.consumer.js";

export async function startConsumers(
  friendRankerService: IFriendRankerService,
  userService: IUserService,
): Promise<void> {
  await Promise.all([
    consumePostLiked(friendRankerService),
    consumePostCommented(friendRankerService),
    consumeUserCreated(userService),
    consumeUserUpdated(userService),
  ]);
}

export async function stopConsumers(): Promise<void> {
  await Promise.allSettled([stopPostEventConsumers(), stopUserEventConsumers()]);
}
