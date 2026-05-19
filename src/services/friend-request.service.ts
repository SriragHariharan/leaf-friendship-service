import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import createError from "http-errors";
import { mapFriendRequestToDto, type FriendRequestDto } from "../dto/friend-request.dto.js";
import type { FriendRelationshipDto } from "../dto/friend-relationship.dto.js";
import type { FriendRequestRepository } from "../repositories/friend-request.repository.interface.js";
import { FriendRequestStatusId } from "../repositories/friend-request.repository.js";
import type {
  FriendRequestService,
  FriendRequestStatusAction,
  IncomingFriendRequestsListDto,
} from "./friend-request.service.interface.js";
import type { IFriendRankerService } from "./friend-ranker.service.interface.js";

export class DefaultFriendRequestService implements FriendRequestService {
  constructor(
    private readonly repo: FriendRequestRepository,
    private readonly friendRanker: IFriendRankerService,
  ) {}

  async sendFriendRequest(callerAud: string, friendId: string): Promise<FriendRequestDto> {
    if (callerAud === friendId) {
      throw createError(400, "Cannot send a friend request to yourself");
    }
    if (await this.repo.existsFriendshipBetween(callerAud, friendId)) {
      throw createError(409, "Users are already friends");
    }

    const incoming = await this.repo.findDirectedRequest(friendId, callerAud);
    if (incoming?.statusId === FriendRequestStatusId.PENDING) {
      throw createError(409, "This user already sent you a friend request");
    }

    const existing = await this.repo.findDirectedRequest(callerAud, friendId);
    if (existing) {
      if (existing.statusId === FriendRequestStatusId.PENDING) {
        throw createError(409, "A friend request between these users already exists");
      }
      if (
        existing.statusId === FriendRequestStatusId.ACCEPTED &&
        (await this.repo.existsFriendshipBetween(callerAud, friendId))
      ) {
        throw createError(409, "Users are already friends");
      }
      const row = await this.repo.reactivateToPending(existing.id);
      return mapFriendRequestToDto(row);
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

  async listIncomingPending(callerAud: string): Promise<IncomingFriendRequestsListDto> {
    const [rows, total] = await Promise.all([
      this.repo.findPendingIncomingForReceiver(callerAud),
      this.repo.countPendingIncomingForReceiver(callerAud),
    ]);
    return {
      friendRequests: rows.map(mapFriendRequestToDto),
      total,
    };
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
    if (status === "accept") {
      const row = await this.repo.acceptByReceiver(friendRequestId, callerAud);
      await Promise.all([
        this.friendRanker.updateFriendRank(
          row.senderId,
          row.receiverId,
          "friend_request_accepted",
        ),
        this.friendRanker.updateFriendRank(
          row.receiverId,
          row.senderId,
          "friend_request_accepted",
        ),
      ]);
      return mapFriendRequestToDto(row);
    }

    const row =
      status === "reject"
        ? await this.repo.rejectByReceiver(friendRequestId, callerAud)
        : await this.repo.cancelBySender(friendRequestId, callerAud);
    return mapFriendRequestToDto(row);
  }
}
