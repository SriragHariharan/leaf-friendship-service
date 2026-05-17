import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import { consumePostCommented, consumePostLiked, stopPostEventConsumers } from "./post-events.consumer.js";

/** Run both post-event consumers concurrently — each run() blocks until disconnect. */
export async function startConsumers(friendRankerService: IFriendRankerService): Promise<void> {
  await Promise.all([
    consumePostLiked(friendRankerService),
    consumePostCommented(friendRankerService),
  ]);
}

export { stopPostEventConsumers as stopConsumers };
