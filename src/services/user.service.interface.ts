import type { UserEventDto } from "../dto/user-event.dto.js";

export interface IUserService {
  handleUserCreated(data: UserEventDto): Promise<void>;
  handleUserUpdated(data: UserEventDto): Promise<void>;
}
