import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

process.env.JWT_SECRET ||= "test-only-jwt-secret-32-characters-long";

const { createApiApp } = await import("../src/server/apiApp.ts");

let server: Server;
let baseUrl: string;

before(async () => {
  server = createApiApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

describe("authentication API", () => {
  it("requires authentication for the current-user endpoint", async () => {
    const { response } = await request("/api/auth/me");
    assert.equal(response.status, 401);
  });

  it("registers every public account as a passenger", async () => {
    const email = `test-${Date.now()}@example.com`;
    const { response, body } = await request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "TestPassword!2026", fullName: "Auth Test", role: "ADMIN" }),
    });
    assert.equal(response.status, 201);
    assert.equal(body.data.user.role, "PASSENGER");
    assert.equal(typeof body.data.token, "string");
  });

  it("rejects admin access without a valid bearer token", async () => {
    const demo = await request("/api/admin/metrics?demo=true");
    assert.equal(demo.response.status, 401);

    const bypass = await request("/api/admin/metrics", {
      headers: { "x-admin-bypass": "skyway-internal" },
    });
    assert.equal(bypass.response.status, 401);
  });
});
