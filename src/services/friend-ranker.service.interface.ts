import type { Friendship } from "@prisma/client";

/** Service for computing and persisting friend interaction rankings. */
export interface IFriendRankerService {
  /**
   * Applies time decay to the existing score, adds weight for the given event,
   * and persists the updated score for the directed friendship (userId → friendId).
   */
  updateFriendRank(userId: string, friendId: string, eventType: string): Promise<Friendship>;
}
