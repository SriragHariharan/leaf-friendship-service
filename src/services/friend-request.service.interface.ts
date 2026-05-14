import type { FriendRequestDto } from "../dto/friend-request.dto.js";

export type FriendRequestStatusAction = "accept" | "reject" | "cancel";

export interface FriendRequestService {
  sendFriendRequest(callerAud: string, friendId: string): Promise<FriendRequestDto>;
  listIncomingPending(callerAud: string): Promise<FriendRequestDto[]>;
  updateStatus(callerAud: string, friendRequestId: string, status: FriendRequestStatusAction): Promise<FriendRequestDto>;
}
