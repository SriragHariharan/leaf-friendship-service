import type { PrismaClient } from "@prisma/client";

/** Prisma `friendRequest` row shape from `create` (matches default selection; avoids `FriendRequest` export issues). */
export type FriendRequestRow = Awaited<ReturnType<PrismaClient["friendRequest"]["create"]>>;

export interface FriendRequestRepository {
  createPending(senderId: string, receiverId: string): Promise<FriendRequestRow>;
  findPendingIncomingForReceiver(receiverId: string): Promise<FriendRequestRow[]>;
  existsFriendshipBetween(userA: string, userB: string): Promise<boolean>;
  acceptByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow>;
  rejectByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow>;
  cancelBySender(requestId: string, senderId: string): Promise<FriendRequestRow>;
}
