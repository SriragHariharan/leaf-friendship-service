import type { User } from "@prisma/client";

export type FriendUserSummaryDto = Pick<User, "id" | "name" | "profilePicture">;

export interface FriendListItemDto {
  userId: string;
  friendId: string;
  createdAt: string;
  friend: FriendUserSummaryDto;
}

export interface FriendsListDto {
  friends: FriendListItemDto[];
  total: number;
}
