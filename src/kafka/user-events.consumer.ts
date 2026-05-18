import type { EachMessagePayload } from "kafkajs";

import type { UserEventDto, UserEventsKafkaPayload } from "../dto/user-event.dto.js";
import type { IUserService } from "../services/user.service.interface.js";
import kafka from "./kafka.js";

const userEventsConsumer = kafka.consumer({ groupId: "friends-service-user-events" });
const userEventsTopic = "user.events";

function parseUserEventsPayload(body: Record<string, unknown>): UserEventsKafkaPayload | null {
  const userID = String(body.userID ?? "").trim();
  const username = String(body.username ?? "").trim();
  if (!userID || !username) {
    return null;
  }

  const rawPicture = body.profilePicture;
  const profilePicture =
    rawPicture === null || rawPicture === undefined ? null : String(rawPicture).trim() || null;

  return { userID, username, profilePicture };
}

function toUserEventDto(payload: UserEventsKafkaPayload): UserEventDto {
  return {
    id: payload.userID,
    name: payload.username,
    profilePicture: payload.profilePicture ?? "",
  };
}

async function handleUserEvent(topic: string, raw: string, userService: IUserService): Promise<void> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw.trim() || "{}") as Record<string, unknown>;
  } catch {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  const payload = parseUserEventsPayload(body);
  if (!payload) {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  await userService.syncUserFromEvent(toUserEventDto(payload));
}

function onUserEventsMessage(topic: string, userService: IUserService) {
  return async ({ message }: EachMessagePayload): Promise<void> => {
    try {
      await handleUserEvent(topic, message.value?.toString() ?? "", userService);
    } catch (err: unknown) {
      console.error(`[kafka:${topic}] failed to process message:`, err);
    }
  };
}

export async function consumeUserEvents(userService: IUserService): Promise<void> {
  await userEventsConsumer.connect();
  await userEventsConsumer.subscribe({ topic: userEventsTopic, fromBeginning: true });
  await userEventsConsumer.run({
    eachMessage: onUserEventsMessage(userEventsTopic, userService),
  });
}

export async function stopUserEventConsumers(): Promise<void> {
  await Promise.allSettled([userEventsConsumer.disconnect()]);
}
