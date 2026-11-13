import React, { useState, useEffect } from 'react';
import { X, Plus, ListMusic, Check } from 'lucide-react';
import type { Track, Playlist } from '../../types/music';
import { getAllPlaylists, savePlaylist } from '../../services/db';

interface AddToPlaylistModalProps {
  track: Track | null;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (track) {
      getAllPlaylists().then((all) => {
        setPlaylists(all);
        const containing = all.filter((p) => p.trackIds.includes(track.id)).map((p) => p.id);
        setAddedIds(new Set(containing));
      });
    }
  }, [track]);

  if (!track) return null;

  const handleToggleTrackInPlaylist = async (playlist: Playlist) => {
    let updatedTrackIds: string[];
    const nextAdded = new Set(addedIds);

    if (playlist.trackIds.includes(track.id)) {
      updatedTrackIds = playlist.trackIds.filter((id) => id !== track.id);
      nextAdded.delete(playlist.id);
    } else {
      updatedTrackIds = [...playlist.trackIds, track.id];
      nextAdded.add(playlist.id);
    }

    const updated: Playlist = {
      ...playlist,
      trackIds: updatedTrackIds,
      updatedAt: Date.now(),
    };

    await savePlaylist(updated);
    setAddedIds(nextAdded);
    setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? updated : p)));
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    const newP: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trackIds: [track.id],
    };
    await savePlaylist(newP);
    setPlaylists((prev) => [...prev, newP]);
    setAddedIds((prev) => new Set(prev).add(newP.id));
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-white truncate">Add to Playlist</h3>
            <p className="text-xs text-neutral-400 truncate">{track.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create new playlist trigger */}
        {isCreating ? (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              autoFocus
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleCreateAndAdd}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
            >
              Add
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-xs font-semibold text-emerald-400 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>
        )}

        {/* Existing playlists */}
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {playlists.map((pl) => {
            const isAdded = addedIds.has(pl.id);
            return (
              <div
                key={pl.id}
                onClick={() => handleToggleTrackInPlaylist(pl)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                  isAdded
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <ListMusic className="w-4 h-4 shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium truncate">{pl.name}</span>
                </div>
                {isAdded && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
