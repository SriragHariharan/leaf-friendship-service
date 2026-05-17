import type { EachMessagePayload } from "kafkajs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type { UserEventDto } from "../dto/user-event.dto.js";
import type { IUserService } from "../services/user.service.interface.js";
import kafka from "./kafka.js";

const userCreatedConsumer = kafka.consumer({ groupId: "friends-service-user-created" });
const userCreatedTopic = "user.created";

const userUpdatedConsumer = kafka.consumer({ groupId: "friends-service-user-updated" });
const userUpdatedTopic = "user.updated";

function parseUserEvent(body: Record<string, unknown>): UserEventDto | null {
  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const profilePicture = String(body.profilePicture ?? "").trim();
  if (!id || !name || !profilePicture) {
    return null;
  }
  return { id, name, profilePicture };
}

async function handleCreated(topic: string, raw: string, userService: IUserService): Promise<void> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw.trim() || "{}") as Record<string, unknown>;
  } catch {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  const data = parseUserEvent(body);
  if (!data) {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  await userService.handleUserCreated(data);
}

async function handleUpdated(topic: string, raw: string, userService: IUserService): Promise<void> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw.trim() || "{}") as Record<string, unknown>;
  } catch {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  const data = parseUserEvent(body);
  if (!data) {
    console.warn(`[kafka:${topic}] skipped invalid message`);
    return;
  }

  await userService.handleUserUpdated(data);
}

function onCreatedMessage(topic: string, userService: IUserService) {
  return async ({ message }: EachMessagePayload): Promise<void> => {
    try {
      await handleCreated(topic, message.value?.toString() ?? "", userService);
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          console.warn(`[kafka:${topic}] user already exists, skipped`);
          return;
        }
      }
      console.error(`[kafka:${topic}] failed to process message:`, err);
    }
  };
}

function onUpdatedMessage(topic: string, userService: IUserService) {
  return async ({ message }: EachMessagePayload): Promise<void> => {
    try {
      await handleUpdated(topic, message.value?.toString() ?? "", userService);
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          console.warn(`[kafka:${topic}] user not found, skipped`);
          return;
        }
      }
      console.error(`[kafka:${topic}] failed to process message:`, err);
    }
  };
}

export async function consumeUserCreated(userService: IUserService): Promise<void> {
  await userCreatedConsumer.connect();
  await userCreatedConsumer.subscribe({ topic: userCreatedTopic, fromBeginning: true });
  await userCreatedConsumer.run({
    eachMessage: onCreatedMessage(userCreatedTopic, userService),
  });
}

export async function consumeUserUpdated(userService: IUserService): Promise<void> {
  await userUpdatedConsumer.connect();
  await userUpdatedConsumer.subscribe({ topic: userUpdatedTopic, fromBeginning: true });
  await userUpdatedConsumer.run({
    eachMessage: onUpdatedMessage(userUpdatedTopic, userService),
  });
}

export async function stopUserEventConsumers(): Promise<void> {
  await Promise.allSettled([userCreatedConsumer.disconnect(), userUpdatedConsumer.disconnect()]);
}
