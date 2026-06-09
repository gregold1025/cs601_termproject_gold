// User wraps the Avatar plus credentials.
// Avatar is mutable — users change their visual choices freely.
// Credentials are placeholder; the auth approach hasn't been chosen yet.

import { Avatar } from "./avatar";

export type User = {
  username: string;
  email: string;
  password: string; // placeholder — replace with hashed credential
  avatar: Avatar;
};
