import type { Friendship } from "@prisma/client";

export interface IFriendsRepository {
    getFriends(userId: string): Promise<Friendship[]>;
    getTopFriendIds(userId: string, limit: number): Promise<string[]>;
    unfriend(userId: string, friendId: string): Promise<void>;
}