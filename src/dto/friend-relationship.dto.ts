export type FriendStatus = "none" | "friends" | "pending_sent" | "pending_received";

export interface FriendRelationshipDto {
  isFriend: boolean;
  friendRequestId: string | null;
  friendStatus: FriendStatus;
}
