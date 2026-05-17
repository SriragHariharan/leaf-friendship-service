import type { UserEventDto } from "../dto/user-event.dto.js";
import type { IUserRepository } from "../repositories/user.repository.interface.js";
import type { IUserService } from "./user.service.interface.js";

export class DefaultUserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async handleUserCreated(data: UserEventDto): Promise<void> {
    await this.userRepository.createUser(data);
  }

  async handleUserUpdated(data: UserEventDto): Promise<void> {
    await this.userRepository.updateUser(data.id, {
      name: data.name,
      profilePicture: data.profilePicture,
    });
  }
}
