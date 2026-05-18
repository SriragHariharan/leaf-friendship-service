import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import type { IUserService } from "../services/user.service.interface.js";
import { consumePostCommented, consumePostLiked, stopPostEventConsumers } from "./post-events.consumer.js";
import { consumeProfileVisited, stopProfileEventConsumers } from "./profile-events.consumer.js";
import { consumeUserEvents, stopUserEventConsumers } from "./user-events.consumer.js";

export async function startConsumers(
  friendRankerService: IFriendRankerService,
  userService: IUserService,
): Promise<void> {
  await Promise.all([
    consumePostLiked(friendRankerService),
    consumePostCommented(friendRankerService),
    consumeProfileVisited(friendRankerService),
    consumeUserEvents(userService),
  ]);
}

export async function stopConsumers(): Promise<void> {
  await Promise.allSettled([
    stopPostEventConsumers(),
    stopProfileEventConsumers(),
    stopUserEventConsumers(),
  ]);
}
