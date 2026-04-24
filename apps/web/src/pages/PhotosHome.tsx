import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PhotosHome() {
  const [folderId, setFolderId] = useState("");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = folderId.trim();
    if (!id) {
      return;
    }
    navigate(`/photos/folder/${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Photos</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Open a Google Drive folder by ID. A folder picker and saved home folder arrive in Slice
        4.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-zinc-200" htmlFor="folder-id">
            Folder ID
          </label>
          <input
            id="folder-id"
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            onChange={(e) => setFolderId(e.target.value)}
            placeholder="From Drive URL or API"
            type="text"
            value={folderId}
          />
        </div>
        <button
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          type="submit"
        >
          Open gallery
        </button>
      </form>
    </div>
  );
}
