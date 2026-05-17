import type { PrismaClient, Friendship } from "@prisma/client";
import createError from "http-errors";
import type { IFriendRankerRepository } from "./friend-ranker.repository.interface.js";

export class PrismaFriendRankerRepository implements IFriendRankerRepository {
  constructor(private readonly db: PrismaClient) {}

  /** Loads the directed friendship row (userId → friendId). */
  async getFriendship(userId: string, friendId: string): Promise<Friendship> {
    const row = await this.db.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });
    if (!row) {
      throw createError(404, "Friendship not found");
    }
    return row;
  }

  /** Persists interaction score and bumps last_interaction_at for the directed edge (userId → friendId). */
  async updateFriendRank(userId: string, friendId: string, score: number): Promise<Friendship> {
    return this.db.friendship.update({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
      data: {
        interactionScore: score,
        lastInteractionAt: new Date(),
      },
    });
  }
}
