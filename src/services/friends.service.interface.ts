import type { FriendsListDto } from "../dto/friend-list.dto.js";

export interface IFriendsService {
    getFriends(userId: string): Promise<FriendsListDto>;
    getTopFriendIds(userId: string, limit: number): Promise<string[]>;
    unfriend(userId: string, friendId: string): Promise<void>;
}