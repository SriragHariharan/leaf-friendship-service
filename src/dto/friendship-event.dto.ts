export type FriendshipEventType = "friend_request.sent";

export interface FriendshipEvent {
  eventType: FriendshipEventType;
  actorUserId: string;
  targetUserId: string;
  requestId: string;
  timestamp: string;
}
