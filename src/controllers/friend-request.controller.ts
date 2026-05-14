import type { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import type { FriendRequestDto } from "../dto/friend-request.dto.js";
import type { FriendRequestService, FriendRequestStatusAction } from "../services/friend-request.service.interface.js";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncRequestHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (req.user?.aud) {
    return req.user.aud;
  }
  const raw = req.headers["x-user-aud"];
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (value === undefined || value === "") {
    throw createError(401, "Authentication required");
  }
  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) {
    throw createError(400, "Invalid X-User-Aud: expected a UUID");
  }
  return trimmed.toLowerCase();
}

export class FriendRequestController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  // Send a friend request to a user
  readonly sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const friendId = requireUuid(req.params.friendId, "friendId");
    const data: FriendRequestDto = await this.friendRequestService.sendFriendRequest(aud, friendId);
    res.status(201).json({ success: true, message: "Friend request sent", data });
  });

  // List incoming pending friend requests
  readonly listIncomingPending = asyncHandler(async (req: Request, res: Response) => {
    const aud = getCallerAud(req);
    const data: FriendRequestDto[] = await this.friendRequestService.listIncomingPending(aud);
    res.status(200).json({ success: true, message: "Friend requests retrieved", data });
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
