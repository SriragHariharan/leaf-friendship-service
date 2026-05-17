import { Friendship } from "@prisma/client";
import { IFriendsService } from "./friends.service.interface.js";
import { IFriendsRepository } from "../repositories/friends.repository.interface.js";

export class DefaultFriendsService implements IFriendsService {
    private readonly friendsRepository: IFriendsRepository;
    constructor(friendsRepository: IFriendsRepository) {
        this.friendsRepository = friendsRepository;
    }

    async getFriends(userId: string): Promise<Friendship[]> {
        return await this.friendsRepository.getFriends(userId);
    }

    async getTopFriendIds(userId: string, limit: number): Promise<string[]> {
        return await this.friendsRepository.getTopFriendIds(userId, limit);
    }

    async unfriend(userId: string, friendId: string): Promise<void> {
        return await this.friendsRepository.unfriend(userId, friendId);
    }
}