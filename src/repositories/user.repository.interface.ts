import type { UserEventDto } from "../dto/user-event.dto.js";

export interface IUserRepository {
  createUser(data: UserEventDto): Promise<void>;
  updateUser(id: string, data: Pick<UserEventDto, "name" | "profilePicture">): Promise<void>;
}
