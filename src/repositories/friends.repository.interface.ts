import type { Friendship } from "@prisma/client";
import type { FriendListItemDto } from "../dto/friend-list.dto.js";

export interface IFriendsRepository {
    getFriendsWithProfiles(userId: string): Promise<FriendListItemDto[]>;
    countFriends(userId: string): Promise<number>;
    getTopFriendIds(userId: string, limit: number): Promise<string[]>;
    hasFriendship(userId: string, friendId: string): Promise<boolean>;
    unfriend(userId: string, friendId: string): Promise<void>;
}