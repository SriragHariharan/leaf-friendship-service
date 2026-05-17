import type { EachMessagePayload } from "kafkajs";
import { isHttpError } from "http-errors";

import type { IFriendRankerService } from "../services/friend-ranker.service.interface.js";
import kafka from "./kafka.js";

const postLikedConsumer = kafka.consumer({ groupId: "friends-service-post-liked" });
const postLikedTopic = "post.liked";

const postCommentedConsumer = kafka.consumer({ groupId: "friends-service-post-commented" });
const postCommentedTopic = "post.commented";

/** Parses a post interaction event and updates the owner's friendship score toward the interactor. */
async function handleMessage(
  topic: string,
  eventType: "post_liked" | "post_commented",
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

  const postOwnerID = String(body.postOwnerID ?? "").trim();
  const interactedUserID = String(body.interactedUserID ?? "").trim();
  if (!postOwnerID || !interactedUserID) {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }
  if (postOwnerID === interactedUserID) {
    console.warn(`[kafka:${topic}] skipped self-interaction`);
    return;
  }

  const type =
    body.type === "post_liked" || body.type === "post_commented" ? body.type : eventType;

  await ranker.updateFriendRank(postOwnerID, interactedUserID, type);
}

/** Returns a Kafka eachMessage handler that delegates to handleMessage with error isolation. */
function onMessage(
  topic: string,
  eventType: "post_liked" | "post_commented",
  ranker: IFriendRankerService,
) {
  return async ({ message }: EachMessagePayload): Promise<void> => {
    try {
      await handleMessage(topic, eventType, message.value?.toString() ?? "", ranker);
    } catch (err: unknown) {
      if (isHttpError(err) && err.status === 404) {
        console.warn(`[kafka:${topic}] friendship not found, skipped`);
        return;
      }
      console.error(`[kafka:${topic}] failed to process message:`, err);
    }
  };
}

/** Subscribes to post.liked and runs the consumer loop. */
export async function consumePostLiked(ranker: IFriendRankerService): Promise<void> {
  await postLikedConsumer.connect();
  await postLikedConsumer.subscribe({ topic: postLikedTopic, fromBeginning: true });
  await postLikedConsumer.run({ 
    eachMessage: onMessage(postLikedTopic, "post_liked", ranker) 
  });
}

/** Subscribes to post.commented and runs the consumer loop. */
export async function consumePostCommented(ranker: IFriendRankerService): Promise<void> {
  await postCommentedConsumer.connect();
  await postCommentedConsumer.subscribe({ topic: postCommentedTopic, fromBeginning: true });
  await postCommentedConsumer.run({
    eachMessage: onMessage(postCommentedTopic, "post_commented", ranker),
  });
}

/** Disconnects both post-event consumers (graceful shutdown). */
export async function stopPostEventConsumers(): Promise<void> {
  await Promise.allSettled([postLikedConsumer.disconnect(), postCommentedConsumer.disconnect()]);
}
