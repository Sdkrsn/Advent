import { getStore } from "@netlify/blobs";

export function giftStore() {
  return getStore("gifts");
}
