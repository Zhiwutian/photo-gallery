import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FolderGalleryPage from "./FolderGalleryPage";

describe("FolderGalleryPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/drive/folders/f1/files")) {
          return new Response(
            JSON.stringify({
              files: [{ id: "img1", name: "One", thumbnailLink: "https://example.com/t.jpg" }],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and shows image tiles", async () => {
    render(
      <MemoryRouter initialEntries={["/photos/folder/f1"]}>
        <Routes>
          <Route element={<FolderGalleryPage />} path="/photos/folder/:folderId" />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("One")).toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: /thumbnail: one/i })).toHaveAttribute(
      "src",
      "https://example.com/t.jpg",
    );
  });
});
