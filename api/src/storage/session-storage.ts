import { Session } from "../types/storage";

const sessions = new Map<string, Session>();

export function createSession(id: string, session: Session) {
  sessions.set(id, session);
}

export function getSession(id: string) {
  return sessions.get(id);
}

export function deleteSession(id: string) {
  sessions.delete(id);
}
