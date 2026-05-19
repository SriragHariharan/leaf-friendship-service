import type { EachMessagePayload } from "kafkajs";
import { isHttpError } from "http-errors";

import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import kafka from "./kafka.js";

const interactionConsumer = kafka.consumer({ groupId: "friends-service-interaction-events" });
const interactionTopic = "interaction.events";

const SUPPORTED_EVENTS = new Set([
  "post.liked",
  "post.unliked",
  "post.commented",
  "post.uncommented",
]);

interface InteractionEventPayload {
  eventType?: string;
  actorUserId?: string;
  targetUserId?: string;
  postId?: string;
  commentId?: string;
  timestamp?: string;
}

/** Parses an interaction event and updates the owner's friendship score toward the actor. */
async function handleMessage(raw: string, ranker: IFriendRankerService): Promise<void> {
  let body: InteractionEventPayload;
  try {
    body = JSON.parse(raw.trim() || "{}") as InteractionEventPayload;
  } catch {
    console.warn(`[kafka:${interactionTopic}] skipped invalid message`);
    return;
  }

  const eventType = String(body.eventType ?? "").trim();
  const targetUserId = String(body.targetUserId ?? "").trim();
  const actorUserId = String(body.actorUserId ?? "").trim();
  const postId = String(body.postId ?? "").trim();

  if (!SUPPORTED_EVENTS.has(eventType) || !targetUserId || !actorUserId || !postId) {
    console.warn(`[kafka:${interactionTopic}] skipped invalid message`);
    return;
  }

  if (targetUserId === actorUserId) {
    console.warn(`[kafka:${interactionTopic}] skipped self-interaction`);
    return;
  }

  if (
    (eventType === "post.commented" || eventType === "post.uncommented") &&
    !String(body.commentId ?? "").trim()
  ) {
    console.warn(`[kafka:${interactionTopic}] skipped comment event without commentId`);
    return;
  }

  await ranker.updateFriendRank(targetUserId, actorUserId, eventType);
}

/** Subscribes to interaction.events and runs the consumer loop. */
export async function consumeInteractionEvents(ranker: IFriendRankerService): Promise<void> {
  await interactionConsumer.connect();
  await interactionConsumer.subscribe({ topic: interactionTopic, fromBeginning: true });
  await interactionConsumer.run({
    eachMessage: async ({ message }: EachMessagePayload): Promise<void> => {
      try {
        await handleMessage(message.value?.toString() ?? "", ranker);
      } catch (err: unknown) {
        if (isHttpError(err) && err.status === 404) {
          console.warn(`[kafka:${interactionTopic}] friendship not found, skipped`);
          return;
        }
        console.error(`[kafka:${interactionTopic}] failed to process message:`, err);
      }
    },
  });
}

/** Disconnects the interaction events consumer (graceful shutdown). */
export async function stopInteractionEventConsumers(): Promise<void> {
  await interactionConsumer.disconnect();
}
