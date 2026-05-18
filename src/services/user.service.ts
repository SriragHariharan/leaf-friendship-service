import type { UserEventDto } from "../dto/user-event.dto.js";
import type { IUserRepository } from "../repositories/user.repository.interface.js";
import type { IUserService } from "./user.service.interface.js";

export class DefaultUserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async syncUserFromEvent(data: UserEventDto): Promise<void> {
    await this.userRepository.upsertUser(data);
  }
}
