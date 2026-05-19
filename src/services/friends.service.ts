import createError from "http-errors";
import type { FriendsListDto } from "../dto/friend-list.dto.js";
import { IFriendsService } from "./friends.service.interface.js";
import { IFriendsRepository } from "../repositories/friends.repository.interface.js";

export class DefaultFriendsService implements IFriendsService {
    private readonly friendsRepository: IFriendsRepository;
    constructor(friendsRepository: IFriendsRepository) {
        this.friendsRepository = friendsRepository;
    }

    async getFriends(userId: string): Promise<FriendsListDto> {
        const [friends, total] = await Promise.all([
            this.friendsRepository.getFriendsWithProfiles(userId),
            this.friendsRepository.countFriends(userId),
        ]);
        return { friends, total };
    }

    async getTopFriendIds(userId: string, limit: number): Promise<string[]> {
        return await this.friendsRepository.getTopFriendIds(userId, limit);
    }

    async unfriend(userId: string, friendId: string): Promise<void> {
        if (userId === friendId) {
            throw createError(400, "Cannot unfriend yourself");
        }
        if (!(await this.friendsRepository.hasFriendship(userId, friendId))) {
            throw createError(404, "Friendship not found");
        }
        return await this.friendsRepository.unfriend(userId, friendId);
    }
}