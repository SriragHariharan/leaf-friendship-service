import type { FriendshipEvent } from "../dto/friendship-event.dto.js";
import { publish } from "./publish.js";

const TOPIC = "friendship.events";

export async function publishFriendshipEvent(event: FriendshipEvent): Promise<void> {
  try {
    await publish(TOPIC, event, event.requestId);
    console.info(
      `[kafka:${TOPIC}] published ${event.eventType} requestId=${event.requestId}`,
    );
  } catch (error) {
    console.error(`[kafka:${TOPIC}] failed to publish ${event.eventType}`, error);
  }
}

export async function publishFriendRequestSent(params: {
  actorUserId: string;
  targetUserId: string;
  requestId: string;
}): Promise<void> {
  await publishFriendshipEvent({
    eventType: "friend_request.sent",
    actorUserId: params.actorUserId,
    targetUserId: params.targetUserId,
    requestId: params.requestId,
    timestamp: new Date().toISOString(),
  });
}
