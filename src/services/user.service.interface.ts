import type { UserEventDto } from "../dto/user-event.dto.js";

export interface IUserService {
  syncUserFromEvent(data: UserEventDto): Promise<void>;
}
