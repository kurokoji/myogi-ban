import assert from "node:assert/strict";
import test from "node:test";
import { cleanupLocalServer } from "../src/server-cleanup";

test("cleanupLocalServer closes the server and removes an existing PID file", () => {
  let closed = 0;
  const removed: string[] = [];
  cleanupLocalServer(
    {
      close: () => {
        closed += 1;
      },
    },
    "/tmp/server.pid",
    {
      exists: () => true,
      remove: (file) => removed.push(file),
    },
  );
  assert.equal(closed, 1);
  assert.deepEqual(removed, ["/tmp/server.pid"]);
});
