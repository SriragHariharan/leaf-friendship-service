import type { FriendRequestDto } from "../dto/friend-request.dto.js";
import type { FriendRelationshipDto } from "../dto/friend-relationship.dto.js";

export type FriendRequestStatusAction = "accept" | "reject" | "cancel";

export interface IncomingFriendRequestsListDto {
  friendRequests: FriendRequestDto[];
  total: number;
}

export interface FriendRequestService {
  sendFriendRequest(callerAud: string, friendId: string): Promise<FriendRequestDto>;
  listIncomingPending(callerAud: string): Promise<IncomingFriendRequestsListDto>;
  getRelationship(callerAud: string, otherUserId: string): Promise<FriendRelationshipDto>;
  updateStatus(callerAud: string, friendRequestId: string, status: FriendRequestStatusAction): Promise<FriendRequestDto>;
}
