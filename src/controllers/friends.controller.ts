import type { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import type { FriendsListDto } from "../dto/friend-list.dto.js";
import type { IFriendsService } from "../services/friends.service.interface.js";
import { requireUserId } from "../utils/params.js";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncRequestHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function getCallerAud(req: Request): string {
  const aud = req.user?.aud;
  const userId = typeof aud === "string" ? aud : Array.isArray(aud) ? aud[0] : undefined;
  if (!userId) {
    throw createError(401, "Authentication required");
  }
  return userId;
}

export class FriendsController {
  constructor(private readonly friendsService: IFriendsService) {}

  readonly getFriends = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCallerAud(req);
    const data: FriendsListDto = await this.friendsService.getFriends(userId);
    res.status(200).json({ success: true, message: "Friends retrieved", data });
  });

  readonly getTopFriendIds = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || getCallerAud(req);
    const limit = 50_000;
    const topFriendIds = await this.friendsService.getTopFriendIds(userId, limit);
    res.status(200).json(topFriendIds);
  });

  readonly unfriend = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCallerAud(req);
    const friendId = requireUserId(req.params.friendId, "friendId");
    await this.friendsService.unfriend(userId, friendId);
    res.status(200).json({ success: true, message: "Unfriended user" });
  });
}
