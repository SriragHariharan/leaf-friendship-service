import type { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import type { FriendRequestDto } from "../dto/friend-request.dto.js";
import type { FriendRelationshipDto } from "../dto/friend-relationship.dto.js";
import type { FriendRequestService, FriendRequestStatusAction } from "../services/friend-request.service.interface.js";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncRequestHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** User-service CUIDs and friend-request row UUIDs */
const USER_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[a-z0-9]{20,32})$/i;

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw createError(400, `Invalid ${field}: expected UUID string`);
  }
  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) {
    throw createError(400, `Invalid ${field}: expected a UUID`);
  }
  return trimmed.toLowerCase();
}

function requireUserId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw createError(400, `Invalid ${field}: expected user id string`);
  }
  const trimmed = value.trim();
  if (!USER_ID_RE.test(trimmed)) {
    throw createError(400, `Invalid ${field}: expected a valid user id`);
  }
  return trimmed;
}

function requireStatus(body: unknown): FriendRequestStatusAction {
  if (body === null || body === undefined || typeof body !== "object") {
    throw createError(400, "JSON body with status is required");
  }
  const status = (body as { status?: unknown }).status;
  if (status !== "accept" && status !== "reject" && status !== "cancel") {
    throw createError(400, "status must be accept, reject, or cancel");
  }
  return status;
}

function getCallerAud(req: Request): string {
  const aud = req.user?.aud;
  const userId = typeof aud === "string" ? aud : Array.isArray(aud) ? aud[0] : undefined;
  if (!userId) {
    throw createError(401, "Authentication required");
  }
  return userId;
}

export class FriendRequestController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  // Send a friend request to a user
  readonly sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const friendId = requireUserId(req.params.friendId, "friendId");
    const data: FriendRequestDto = await this.friendRequestService.sendFriendRequest(aud, friendId);
    res.status(201).json({ success: true, message: "Friend request sent", data });
  });

  // List incoming pending friend requests
  readonly listIncomingPending = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const data: FriendRequestDto[] = await this.friendRequestService.listIncomingPending(aud);
    res.status(200).json({ success: true, message: "Friend requests retrieved", data });
  });

  readonly getRelationship = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const otherUserId = requireUserId(req.params.otherUserId, "otherUserId");
    const data: FriendRelationshipDto = await this.friendRequestService.getRelationship(aud, otherUserId);
    res.status(200).json({ success: true, message: "Relationship retrieved", data });
  });

  // Update the status of a friend request
  readonly patchFriendRequestStatus = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const friendRequestId = requireUuid(req.params.friendRequestId, "friendRequestId");
    const status = requireStatus(req.body);
    const data: FriendRequestDto = await this.friendRequestService.updateStatus(aud, friendRequestId, status);
    res.status(200).json({ success: true, message: "Friend request updated", data });
  });
}
