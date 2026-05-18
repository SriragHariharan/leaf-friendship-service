import type { UserEventDto } from "../dto/user-event.dto.js";

export interface IUserRepository {
  upsertUser(data: UserEventDto): Promise<void>;
}
