import type { PrismaClient } from "@prisma/client";
import type { UserEventDto } from "../dto/user-event.dto.js";
import type { IUserRepository } from "./user.repository.interface.js";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertUser(data: UserEventDto): Promise<void> {
    await this.db.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        profilePicture: data.profilePicture,
      },
      update: {
        name: data.name,
        profilePicture: data.profilePicture,
      },
    });
  }
}
