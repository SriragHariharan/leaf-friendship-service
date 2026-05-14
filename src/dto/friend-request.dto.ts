import createError from "http-errors";
import type { FriendRequestRow } from "../repositories/friend-request.repository.interface.js";

export type FriendRequestStatusLabel = "pending" | "accepted" | "rejected" | "cancelled";

export interface FriendRequestDto {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatusLabel;
  createdAt: string;
  updatedAt: string;
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

export function mapFriendRequestToDto(row: FriendRequestRow): FriendRequestDto {
  return {
    id: row.id,
    senderId: row.senderId,
    receiverId: row.receiverId,
    status: statusIdToLabel(row.statusId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
