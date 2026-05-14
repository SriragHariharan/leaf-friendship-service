import type { PrismaClient } from "@prisma/client";
import createError from "http-errors";
import type { FriendRequestRepository, FriendRequestRow } from "./friend-request.repository.interface.js";

/** Matches `friend_request_statuses.id` / `friend_requests.status` (SMALLINT). */
const FriendRequestStatusId = {
  PENDING: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  CANCELLED: 3,
} as const;

export class PrismaFriendRequestRepository implements FriendRequestRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPending(senderId: string, receiverId: string): Promise<FriendRequestRow> {
    return this.db.friendRequest.create({
      data: {
        senderId,
        receiverId,
        statusId: FriendRequestStatusId.PENDING,
      },
    });
  }

  async findPendingIncomingForReceiver(receiverId: string): Promise<FriendRequestRow[]> {
    return this.db.friendRequest.findMany({
      where: {
        receiverId,
        statusId: FriendRequestStatusId.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async existsFriendshipBetween(userA: string, userB: string): Promise<boolean> {
    const count = await this.db.friendship.count({
      where: {
        OR: [
          { userId: userA, friendId: userB },
          { userId: userB, friendId: userA },
        ],
      },
    });
    return count > 0;
  }

  async acceptByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow> {
    return this.db.$transaction(async (tx: any) => {
      const row = await tx.friendRequest.findUnique({ where: { id: requestId } });
      if (!row) {
        throw createError(404, "Friend request not found");
      }
      if (row.receiverId !== receiverId) {
        throw createError(403, "Only the receiver can accept this friend request");
      }
      if (row.statusId !== FriendRequestStatusId.PENDING) {
        throw createError(409, "Friend request is no longer pending");
      }
      const updated = await tx.friendRequest.update({
        where: { id: requestId },
        data: { statusId: FriendRequestStatusId.ACCEPTED },
      });
      await tx.friendship.createMany({
        data: [
          { userId: row.senderId, friendId: row.receiverId },
          { userId: row.receiverId, friendId: row.senderId },
        ],
        skipDuplicates: true,
      });
      return updated;
    });
  }

  async rejectByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow> {
    const row = await this.db.friendRequest.findUnique({ where: { id: requestId } });
    if (!row) {
      throw createError(404, "Friend request not found");
    }
    if (row.receiverId !== receiverId) {
      throw createError(403, "Only the receiver can reject this friend request");
    }
    if (row.statusId !== FriendRequestStatusId.PENDING) {
      throw createError(409, "Friend request is no longer pending");
    }
    return this.db.friendRequest.update({
      where: { id: requestId },
      data: { statusId: FriendRequestStatusId.REJECTED },
    });
  }

  async cancelBySender(requestId: string, senderId: string): Promise<FriendRequestRow> {
    const row = await this.db.friendRequest.findUnique({ where: { id: requestId } });
    if (!row) {
      throw createError(404, "Friend request not found");
    }
    if (row.senderId !== senderId) {
      throw createError(403, "Only the sender can cancel this friend request");
    }
    if (row.statusId !== FriendRequestStatusId.PENDING) {
      throw createError(409, "Friend request is no longer pending");
    }
    return this.db.friendRequest.update({
      where: { id: requestId },
      data: { statusId: FriendRequestStatusId.CANCELLED },
    });
  }
}
