import type { Friendship } from "@prisma/client";

export interface IFriendRankerRepository {
  /** Loads the directed friendship row (userId → friendId). */
  getFriendship(userId: string, friendId: string): Promise<Friendship>;

  /**
   * Updates `interaction_score` for the directed friendship row (userId → friendId).
   */
  updateFriendRank(userId: string, friendId: string, score: number): Promise<Friendship>;
}
