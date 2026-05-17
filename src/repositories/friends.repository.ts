import { Friendship, PrismaClient } from "@prisma/client";
import { IFriendsRepository } from "./friends.repository.interface.js";

export class PrismaFriendsRepository implements IFriendsRepository {
	constructor(private readonly db: PrismaClient) {}

	async getFriends(userId: string): Promise<Friendship[]> {
		return await this.db.friendship.findMany({
			where: {
				userId: userId,
			},
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