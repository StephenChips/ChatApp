import { openDB } from "idb";

export const DATABASE_VERSION = 1;
export const DATABASE_NAME = "ChatApp";

export enum ObjectStore {
  ChatMessage = "chat-message"
}

export async function openIndexedDB() {
  return await openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      const objectStore = database.createObjectStore(ObjectStore.ChatMessage, {
        keyPath: "id",
        autoIncrement: true
      });
      objectStore.createIndex("appUserID, contactUserID", ["appUserID", "contactUserID"]);
    },
  });
}
