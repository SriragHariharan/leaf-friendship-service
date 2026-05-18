export type UserEventsKafkaPayload = {
  userID: string;
  username: string;
  profilePicture: string | null;
};

export type UserEventDto = {
  id: string;
  name: string;
  profilePicture: string;
};
