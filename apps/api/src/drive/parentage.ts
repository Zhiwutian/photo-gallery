export type HttpFetch = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Returns true if `folderId` appears anywhere on the parent chain above `fileId`
 * (including when `fileId` is a direct child of `folderId`).
 */
export async function isFileUnderFolder(
  fetchFn: HttpFetch,
  accessToken: string,
  fileId: string,
  folderId: string,
  maxVisited = 200,
): Promise<boolean> {
  const queue: string[] = [fileId];
  const visited = new Set<string>();
  while (queue.length > 0 && visited.size < maxVisited) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    const res = await fetchFn(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(current)}?fields=parents`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      return false;
    }
    const data = (await res.json()) as { parents?: string[] };
    const parents = data.parents ?? [];
    if (parents.includes(folderId)) {
      return true;
    }
    for (const p of parents) {
      queue.push(p);
    }
  }
  return false;
}
