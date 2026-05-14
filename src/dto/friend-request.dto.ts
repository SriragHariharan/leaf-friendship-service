import type { User } from "@prisma/client";
import createError from "http-errors";
import type { FriendRequestRow, FriendRequestWithUsers } from "../repositories/friend-request.repository.interface.js";

export type FriendRequestStatusLabel = "pending" | "accepted" | "rejected" | "cancelled";

export type FriendUserSummaryDto = Pick<User, "id" | "name" | "profilePicture">;

export interface FriendRequestDto {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatusLabel;
  createdAt: string;
  updatedAt: string;
  /** Present when the row was loaded with `include: { sender: true }`. */
  sender?: FriendUserSummaryDto;
  /** Present when the row was loaded with `include: { receiver: true }`. */
  receiver?: FriendUserSummaryDto;
}

function statusIdToLabel(statusId: number): FriendRequestStatusLabel {
  switch (statusId) {
    case 0:
      return "pending";
    case 1:
      return "accepted";
    case 2:
      return "rejected";
    case 3:
      return "cancelled";
    default:
      throw createError(500, "Unknown friend request status in database row");
  }
}

function mapUserSummary(u: Pick<User, "id" | "name" | "profilePicture">): FriendUserSummaryDto {
  return { id: u.id, name: u.name, profilePicture: u.profilePicture };
}

export function mapFriendRequestToDto(row: FriendRequestRow | FriendRequestWithUsers): FriendRequestDto {
  const base: FriendRequestDto = {
    id: row.id,
    senderId: row.senderId,
    receiverId: row.receiverId,
    status: statusIdToLabel(row.statusId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if ("sender" in row && row.sender) {
    base.sender = mapUserSummary(row.sender);
  }
  if ("receiver" in row && row.receiver) {
    base.receiver = mapUserSummary(row.receiver);
  }
  return base;
}
