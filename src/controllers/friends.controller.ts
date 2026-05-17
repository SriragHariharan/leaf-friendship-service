import { NextFunction, Request, Response } from "express";
import { IFriendsService } from "../services/friends.service.interface.js";

class FriendsController {
    private readonly friendsService: IFriendsService;
    constructor(friendsService: IFriendsService) {
        this.friendsService = friendsService;
    }

    //get friends for a user
    async getFriends(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.aud;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }
            const friends = await this.friendsService.getFriends(userId);
            res.status(200).json(friends);
        } catch (error) {
            next(error);
        }
    }

    //get top friend ids of a user (used for feed service)
    // for feed fanouts
    async getTopFriendIds(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.aud;
            const limit = 50_000;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }
            const topFriendIds = await this.friendsService.getTopFriendIds(userId, limit);
            res.status(200).json(topFriendIds);
        } catch (error) {
            next(error);
        }
    }
}