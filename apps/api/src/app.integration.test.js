import request from "supertest";
import { describe, expect, it } from "vitest";
import { APPLICATION_STATUSES } from "@jat/shared";
import app from "./app.js";

describe("API baseline integration", () => {
  it("returns status metadata from /api/meta/statuses", async () => {
    const response = await request(app).get("/api/meta/statuses");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeTruthy();
    expect(response.body.data.statuses).toEqual(APPLICATION_STATUSES);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body.meta).toMatchObject({
      requestId: response.headers["x-request-id"],
      method: "GET",
      path: "/api/meta/statuses",
    });
    expect(typeof response.body.meta.timestamp).toBe("string");
  });

  it("returns NOT_FOUND shape for unknown public routes", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body.meta).toMatchObject({
      requestId: response.headers["x-request-id"],
      method: "GET",
      path: "/does-not-exist",
    });
  });

  it("returns UNAUTHORIZED with standardized metadata when auth token is missing", async () => {
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body.meta).toMatchObject({
      requestId: response.headers["x-request-id"],
      method: "GET",
      path: "/api/applications",
    });
  });
});
