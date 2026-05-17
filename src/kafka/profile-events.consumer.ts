import type { EachMessagePayload } from "kafkajs";
import { isHttpError } from "http-errors";

import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import kafka from "./kafka.js";

const profileVisitedConsumer = kafka.consumer({ groupId: "friends-service-profile-visited" });
const profileVisitedTopic = "profile.visited";

/** Parses a profile visit event and updates the owner's friendship score toward the visitor. */
async function handleMessage(
  topic: string,
  raw: string,
  ranker: IFriendRankerService,
): Promise<void> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw.trim() || "{}") as Record<string, unknown>;
  } catch {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  const profileOwnerID = String(body.profileOwnerID ?? "").trim();
  const visitorUserID = String(body.visitorUserID ?? "").trim();
  if (!profileOwnerID || !visitorUserID) {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }
  if (profileOwnerID === visitorUserID) {
    console.warn(`[kafka:${topic}] skipped self-visit`);
    return;
  }

  await ranker.updateFriendRank(profileOwnerID, visitorUserID, "profile_visited");
}

function onMessage(topic: string, ranker: IFriendRankerService) {
  return async ({ message }: EachMessagePayload): Promise<void> => {
    try {
      await handleMessage(topic, message.value?.toString() ?? "", ranker);
    } catch (err: unknown) {
      if (isHttpError(err) && err.status === 404) {
        console.warn(`[kafka:${topic}] friendship not found, skipped`);
        return;
      }
      console.error(`[kafka:${topic}] failed to process message:`, err);
    }
  };
}

export async function consumeProfileVisited(ranker: IFriendRankerService): Promise<void> {
  await profileVisitedConsumer.connect();
  await profileVisitedConsumer.subscribe({ topic: profileVisitedTopic, fromBeginning: true });
  await profileVisitedConsumer.run({
    eachMessage: onMessage(profileVisitedTopic, ranker),
  });
}

export async function stopProfileEventConsumers(): Promise<void> {
  await Promise.allSettled([profileVisitedConsumer.disconnect()]);
}
