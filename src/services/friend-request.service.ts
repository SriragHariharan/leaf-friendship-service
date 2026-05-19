import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import createError from "http-errors";
import { mapFriendRequestToDto, type FriendRequestDto } from "../dto/friend-request.dto.js";
import type { FriendRelationshipDto } from "../dto/friend-relationship.dto.js";
import type { FriendRequestRepository } from "../repositories/friend-request.repository.interface.js";
import type { FriendRequestService, FriendRequestStatusAction } from "./friend-request.service.interface.js";

export class DefaultFriendRequestService implements FriendRequestService {
  constructor(private readonly repo: FriendRequestRepository) {}

  async sendFriendRequest(callerAud: string, friendId: string): Promise<FriendRequestDto> {
    if (callerAud === friendId) {
      throw createError(400, "Cannot send a friend request to yourself");
    }
    if (await this.repo.existsFriendshipBetween(callerAud, friendId)) {
      throw createError(409, "Users are already friends");
    }
    try {
      const row = await this.repo.createPending(callerAud, friendId);
      return mapFriendRequestToDto(row);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
        throw createError(409, "A friend request between these users already exists");
      }
      throw e;
    }
  }

  async listIncomingPending(callerAud: string): Promise<FriendRequestDto[]> {
    const rows = await this.repo.findPendingIncomingForReceiver(callerAud);
    return rows.map(mapFriendRequestToDto);
  }

  async getRelationship(callerAud: string, otherUserId: string): Promise<FriendRelationshipDto> {
    if (callerAud === otherUserId) {
      throw createError(400, "Cannot get relationship with yourself");
    }
    if (await this.repo.existsFriendshipBetween(callerAud, otherUserId)) {
      return { isFriend: true, friendRequestId: null, friendStatus: "friends" };
    }
    const pending = await this.repo.findPendingBetween(callerAud, otherUserId);
    if (pending) {
      const friendStatus = pending.senderId === callerAud ? "pending_sent" : "pending_received";
      return { isFriend: false, friendRequestId: pending.id, friendStatus };
    }
    return { isFriend: false, friendRequestId: null, friendStatus: "none" };
  }

  async updateStatus(
    callerAud: string,
    friendRequestId: string,
    status: FriendRequestStatusAction,
  ): Promise<FriendRequestDto> {
    const row =
      status === "accept"
        ? await this.repo.acceptByReceiver(friendRequestId, callerAud)
        : status === "reject"
          ? await this.repo.rejectByReceiver(friendRequestId, callerAud)
          : await this.repo.cancelBySender(friendRequestId, callerAud);
    return mapFriendRequestToDto(row);
  }
}
