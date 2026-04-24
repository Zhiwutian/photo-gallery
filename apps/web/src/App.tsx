import { Link, Route, Routes } from "react-router-dom";
import FolderGalleryPage from "./pages/FolderGalleryPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import PhotosHome from "./pages/PhotosHome.tsx";

export default function App() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <nav
        aria-label="Primary"
        className="flex gap-4 border-b border-zinc-800 px-6 py-3 text-sm"
      >
        <Link className="text-zinc-300 hover:text-white" to="/">
          Home
        </Link>
        <Link className="text-zinc-300 hover:text-white" to="/photos">
          Photos
        </Link>
      </nav>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<PhotosHome />} path="/photos" />
        <Route element={<FolderGalleryPage />} path="/photos/folder/:folderId" />
      </Routes>
    </div>
  );
}
