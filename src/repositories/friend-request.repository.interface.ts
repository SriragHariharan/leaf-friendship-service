import type { Prisma, PrismaClient } from "@prisma/client";

export type FriendRequestRow = Awaited<ReturnType<PrismaClient["friendRequest"]["create"]>>;

export type FriendRequestWithUsers = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

export interface FriendRequestRepository {
  createPending(senderId: string, receiverId: string): Promise<FriendRequestRow>;
  findDirectedRequest(senderId: string, receiverId: string): Promise<FriendRequestRow | null>;
  reactivateToPending(requestId: string): Promise<FriendRequestRow>;
  findPendingIncomingForReceiver(receiverId: string): Promise<FriendRequestWithUsers[]>;
  countPendingIncomingForReceiver(receiverId: string): Promise<number>;
  findPendingBetween(userA: string, userB: string): Promise<FriendRequestRow | null>;
  existsFriendshipBetween(userA: string, userB: string): Promise<boolean>;
  acceptByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow>;
  rejectByReceiver(requestId: string, receiverId: string): Promise<FriendRequestRow>;
  cancelBySender(requestId: string, senderId: string): Promise<FriendRequestRow>;
}
