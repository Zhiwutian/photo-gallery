import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /drive gallery/i })).toBeInTheDocument();
  });
});
