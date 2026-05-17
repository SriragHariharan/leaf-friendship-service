import { Friendship, PrismaClient } from "@prisma/client";
import { IFriendsRepository } from "./friends.repository.interface.js";

class FriendsRepository implements IFriendsRepository {
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
}