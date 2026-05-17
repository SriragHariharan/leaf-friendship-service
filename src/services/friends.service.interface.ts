import { Friendship } from "@prisma/client";

export interface IFriendsService {
    getFriends(userId: string): Promise<Friendship[]>;
    getTopFriendIds(userId: string, limit: number): Promise<string[]>;
    unfriend(userId: string, friendId: string): Promise<void>;
}