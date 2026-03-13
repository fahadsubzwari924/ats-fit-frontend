import { User } from "@core/models/user/user.model";

export class LoginResponse {
  user: User;
  accessToken: string;

  constructor(response: {user: any, access_token: string}) {
    this.user = new User(response?.user);
    this.accessToken = response?.access_token;
  }
}
