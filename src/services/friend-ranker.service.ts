import type { Friendship } from "@prisma/client";
import type { IFriendRankerService } from "./friend-ranker.service.interface.js";
import type { IFriendRankerRepository } from "../repositories/friend-ranker.repository.interface.js";

/** Per-event interaction weights used when ranking friends. */
const FRIEND_RANK_SCORE = {
  POST_LIKED: 2,
  POST_COMMENTED: 5,
  FRIEND_REQUEST_ACCEPTED: 50,
  PROFILE_VISIT: 1,
  IMAGE_VIEW: 0.5,
} as const;

/** Maps incoming event type strings to their interaction weight. */
const EVENT_SCORE_MAP: Record<string, number> = {
  post_liked: FRIEND_RANK_SCORE.POST_LIKED,
  post_commented: FRIEND_RANK_SCORE.POST_COMMENTED,
  friend_request_accepted: FRIEND_RANK_SCORE.FRIEND_REQUEST_ACCEPTED,
  profile_visited: FRIEND_RANK_SCORE.PROFILE_VISIT,
  image_viewed: FRIEND_RANK_SCORE.IMAGE_VIEW,
};

export class FriendRankerService implements IFriendRankerService {
  constructor(private readonly friendRankerRepository: IFriendRankerRepository) {}

  /**
   * Lazy decay: score / (1 + ageInDays * decayRate).
   * Applied on write so stale interactions lose weight before adding the new event.
   */
  private calculateDecayScore(currentScore: number, lastInteractionAt: Date): number {
    const ageInDays =
      (Date.now() - new Date(lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);

    const decayRate = 0.05;

    return currentScore / (1 + ageInDays * decayRate);
  }

  /**
   * Resolves event weight, decays using stored lastInteractionAt, adds the new weight,
   * and persists score + lastInteractionAt for the directed edge (userId → friendId).
   */
  async updateFriendRank(
    userId: string,
    friendId: string,
    eventType: string,
  ): Promise<Friendship> {
    const eventScore = EVENT_SCORE_MAP[eventType] ?? 0;

    const existingFriendship = await this.friendRankerRepository.getFriendship(
      userId,
      friendId,
    );

    const lastInteractionAt =
      existingFriendship.lastInteractionAt ?? existingFriendship.createdAt;

    const decayedScore = this.calculateDecayScore(
      existingFriendship.interactionScore,
      lastInteractionAt,
    );

    const updatedScore = decayedScore + eventScore;

    return this.friendRankerRepository.updateFriendRank(userId, friendId, updatedScore);
  }
}
