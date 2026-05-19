import { PrismaClient } from "@prisma/client";
import type { FriendListItemDto } from "../dto/friend-list.dto.js";
import { IFriendsRepository } from "./friends.repository.interface.js";

export class PrismaFriendsRepository implements IFriendsRepository {
	constructor(private readonly db: PrismaClient) {}

	async getFriendsWithProfiles(userId: string): Promise<FriendListItemDto[]> {
		const friendships = await this.db.friendship.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		if (friendships.length === 0) {
			return [];
		}

		const friendIds = friendships.map((f) => f.friendId);
		const users = await this.db.user.findMany({
			where: { id: { in: friendIds } },
			select: { id: true, name: true, profilePicture: true },
		});
		const userById = new Map(users.map((u) => [u.id, u]));

		return friendships
			.map((f) => {
				const friend = userById.get(f.friendId);
				if (!friend) return null;
				return {
					userId: f.userId,
					friendId: f.friendId,
					createdAt: f.createdAt.toISOString(),
					friend: {
						id: friend.id,
						name: friend.name,
						profilePicture: friend.profilePicture,
					},
				};
			})
			.filter((item): item is FriendListItemDto => item !== null);
	}

	async countFriends(userId: string): Promise<number> {
		return this.db.friendship.count({
			where: { userId },
		});
	}

	async getTopFriendIds(userId: string, limit: number): Promise<string[]> {
		const friendships = await this.db.friendship.findMany({
			where: {
				userId: userId,
			},
			orderBy: {
				interactionScore: "desc",
			},
			select: {
				friendId: true,
			},
			take: limit,
		});

		return friendships.map((f) => f.friendId);
	}

	async hasFriendship(userId: string, friendId: string): Promise<boolean> {
		const count = await this.db.friendship.count({
			where: { userId, friendId },
		});
		return count > 0;
	}

	async unfriend(userId: string, friendId: string): Promise<void> {
        // two way relationship A => B && B => A
		await this.db.friendship.deleteMany({
			where: {
				OR: [
					{ userId, friendId },
					{ userId: friendId, friendId: userId },
				],
			},
		});
	}
}