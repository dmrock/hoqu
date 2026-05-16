export const USER_PASSWORD = "test-password-1234";

export type TestUser = {
  email: string;
  name: string;
  username: string;
};

export const USER_A: TestUser = {
  email: "alice@e2e.test",
  name: "Alice",
  username: "alice-e2e",
};

export const USER_B: TestUser = {
  email: "bob@e2e.test",
  name: "Bob",
  username: "bob-e2e",
};

export const STORAGE_STATE = {
  userA: "e2e/.auth/userA.json",
  userB: "e2e/.auth/userB.json",
} as const;
