import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../lib/api";

type DriveFile = {
  id: string;
  name?: string;
  mimeType?: string;
  thumbnailLink?: string;
};

type ListResponse = { files: DriveFile[]; nextPageToken?: string };

export default function FolderGalleryPage() {
  const { folderId: folderIdParam = "" } = useParams<{ folderId: string }>();
  const folderId = folderIdParam ? decodeURIComponent(folderIdParam) : "";

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<DriveFile | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(
    async (pageToken?: string): Promise<ListResponse | null> => {
      if (!folderId) {
        return null;
      }
      const params = new URLSearchParams();
      if (pageToken) {
        params.set("pageToken", pageToken);
      }
      const qs = params.toString();
      const path = `/api/drive/folders/${encodeURIComponent(folderId)}/files${qs ? `?${qs}` : ""}`;
      const res = await fetch(apiUrl(path), { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      return (await res.json()) as ListResponse;
    },
    [folderId],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!folderId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setFiles([]);
      setNextPageToken(undefined);
      try {
        const data = await load();
        if (!cancelled && data) {
          setFiles(data.files);
          setNextPageToken(data.nextPageToken);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load folder.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId, load]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
      }
    };
    window.addEventListener("keydown", onKey);
    queueMicrotask(() => closeRef.current?.focus());
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  async function loadMore() {
    if (!nextPageToken) {
      return;
    }
    setLoadingMore(true);
    setError(null);
    try {
      const data = await load(nextPageToken);
      if (!data) {
        return;
      }
      setFiles((prev) => [...prev, ...data.files]);
      setNextPageToken(data.nextPageToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  function mediaSrc(fileId: string) {
    const q = new URLSearchParams({ folderId });
    return apiUrl(`/api/drive/files/${encodeURIComponent(fileId)}/media?${q}`);
  }

  if (!folderId) {
    return (
      <div className="px-6 py-12 text-sm text-zinc-400">
        Missing folder id in the URL.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Folder gallery</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{folderId}</p>
      </header>

      {loading ? (
        <p className="text-sm text-zinc-400" role="status">
          Loading images…
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-amber-300" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && files.length === 0 ? (
        <p className="text-sm text-zinc-400">No images in this folder.</p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f) => (
          <li key={f.id}>
            <button
              className="group w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              onClick={() => setActive(f)}
              type="button"
            >
              <div className="aspect-square w-full overflow-hidden bg-zinc-950">
                {f.thumbnailLink ? (
                  <img
                    alt={f.name ? `Thumbnail: ${f.name}` : "Photo thumbnail"}
                    className="h-full w-full object-cover transition group-hover:opacity-90"
                    height={200}
                    loading="lazy"
                    src={f.thumbnailLink}
                    width={200}
                  />
                ) : (
                  <img
                    alt={f.name ? `Thumbnail: ${f.name}` : "Photo thumbnail"}
                    className="h-full w-full object-cover"
                    height={200}
                    loading="lazy"
                    src={mediaSrc(f.id)}
                    width={200}
                  />
                )}
              </div>
              <p className="truncate px-2 py-1.5 text-xs text-zinc-300">{f.name ?? f.id}</p>
            </button>
          </li>
        ))}
      </ul>

      {nextPageToken ? (
        <div className="mt-8">
          <button
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => void loadMore()}
            type="button"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}

      {active ? (
        <div
          aria-labelledby="lightbox-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] max-w-4xl overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-zinc-200" id="lightbox-title">
                {active.name ?? active.id}
              </h2>
              <button
                className="rounded-md border border-zinc-600 px-3 py-1 text-xs text-white hover:bg-zinc-800"
                onClick={() => setActive(null)}
                ref={closeRef}
                type="button"
              >
                Close
              </button>
            </div>
            <img
              alt={active.name ? `Preview: ${active.name}` : "Photo preview"}
              className="max-h-[75vh] w-auto max-w-full object-contain"
              src={mediaSrc(active.id)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
