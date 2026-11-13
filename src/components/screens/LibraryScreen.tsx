import React, { useState, useEffect, useMemo } from 'react';
import { Music2, Disc3, User, Heart, ListMusic, Plus, Trash2 } from 'lucide-react';
import type { Track, Album, Artist, Playlist } from '../../types/music';
import {
  getAllTracks,
  getFavorites,
  toggleFavorite,
  getAllPlaylists,
  savePlaylist,
  deletePlaylist,
} from '../../services/db';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';

type LibraryTab = 'songs' | 'albums' | 'artists' | 'playlists' | 'favourites';

interface LibraryScreenProps {
  onSelectAlbum?: (album: Album) => void;
  onSelectArtist?: (artist: Artist) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onSelectAlbum, onSelectArtist }) => {
  const { playTrack } = usePlayer();
  const [tab, setTab] = useState<LibraryTab>('songs');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const loadData = async () => {
    const [allT, allF, allP] = await Promise.all([
      getAllTracks(),
      getFavorites(),
      getAllPlaylists(),
    ]);
    setTracks(allT);
    setFavorites(allF);
    setPlaylists(allP);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFav = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    const isNowFav = await toggleFavorite(trackId);
    setFavorites((prev) => (isNowFav ? [...prev, trackId] : prev.filter((id) => id !== trackId)));
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const newP: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trackIds: [],
    };
    await savePlaylist(newP);
    setNewPlaylistName('');
    setShowCreateModal(false);
    loadData();
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this playlist?')) {
      await deletePlaylist(id);
      loadData();
    }
  };

  // Group albums and artists
  const { albums, artists } = useMemo(() => {
    const albumMap = new Map<string, Album>();
    const artistMap = new Map<string, Artist>();

    for (const track of tracks) {
      const albName = track.album || 'Unknown Album';
      const albKey = `${albName}-${track.artist}`;
      if (!albumMap.has(albKey)) {
        albumMap.set(albKey, {
          id: albKey,
          name: albName,
          artist: track.artist,
          trackCount: 0,
          tracks: [],
          coverArtUrl: track.coverArtUrl,
        });
      }
      const alb = albumMap.get(albKey)!;
      alb.trackCount++;
      alb.tracks.push(track);
      if (!alb.coverArtUrl && track.coverArtUrl) {
        alb.coverArtUrl = track.coverArtUrl;
      }

      const artName = track.artist || 'Unknown Artist';
      if (!artistMap.has(artName)) {
        artistMap.set(artName, {
          id: artName,
          name: artName,
          trackCount: 0,
          albumCount: 0,
          tracks: [],
        });
      }
      const art = artistMap.get(artName)!;
      art.trackCount++;
      art.tracks.push(track);
    }

    return {
      albums: Array.from(albumMap.values()),
      artists: Array.from(artistMap.values()),
    };
  }, [tracks]);

  const favoriteTracks = useMemo(
    () => tracks.filter((t) => favorites.includes(t.id)),
    [tracks, favorites]
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Your Library</h1>
        {tab === 'playlists' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-900">
        {[
          { id: 'songs' as LibraryTab, label: 'Songs', count: tracks.length },
          { id: 'albums' as LibraryTab, label: 'Albums', count: albums.length },
          { id: 'artists' as LibraryTab, label: 'Artists', count: artists.length },
          { id: 'playlists' as LibraryTab, label: 'Playlists', count: playlists.length },
          { id: 'favourites' as LibraryTab, label: 'Favourites', count: favoriteTracks.length },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`pb-3 px-3 text-xs md:text-sm font-semibold transition relative whitespace-nowrap ${
              tab === item.id ? 'text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {item.label} ({item.count})
            {tab === item.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content for Songs Tab */}
      {tab === 'songs' && (
        <div className="space-y-1.5">
          {tracks.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Music2 className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-medium text-neutral-300">No songs found in library</p>
              <p className="text-xs text-neutral-400 mt-1">Connect a folder in Google Drive to stream.</p>
            </div>
          ) : (
            tracks.map((track, i) => {
              const isFav = favorites.includes(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700/60 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs text-neutral-400 w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {track.coverArtUrl ? (
                        <img
                          src={track.coverArtUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-200 group-hover:text-emerald-400 truncate transition">
                        {track.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {track.artist} • {track.album}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-2">
                    <button
                      onClick={(e) => handleToggleFav(e, track.id)}
                      className="p-1 text-neutral-400 hover:text-white transition"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-emerald-500 text-emerald-500' : 'hover:text-white'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-neutral-400 font-mono">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content for Albums Tab */}
      {tab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum?.(album)}
              className="bg-neutral-900/60 hover:bg-neutral-850 p-3 rounded-xl border border-neutral-800/60 transition cursor-pointer group"
            >
              <div className="aspect-square rounded-lg bg-neutral-800 overflow-hidden mb-2.5 flex items-center justify-center relative">
                {album.coverArtUrl ? (
                  <img
                    src={album.coverArtUrl}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <Disc3 className="w-12 h-12 text-neutral-400" />
                )}
              </div>
              <h3 className="font-semibold text-sm text-neutral-100 truncate">{album.name}</h3>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{album.artist}</p>
              <p className="text-[11px] text-neutral-400 mt-1">{album.trackCount} tracks</p>
            </div>
          ))}
        </div>
      )}

      {/* Content for Artists Tab */}
      {tab === 'artists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist?.(artist)}
              className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800/60 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-200 truncate">{artist.name}</p>
                <p className="text-xs text-neutral-400">{artist.trackCount} songs</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content for Favourites Tab */}
      {tab === 'favourites' && (
        <div className="space-y-1.5">
          {favoriteTracks.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Heart className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-medium text-neutral-300">No favourites yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Tap the heart on any song to add it to your favourites.
              </p>
            </div>
          ) : (
            favoriteTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, favoriteTracks)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 hover:bg-neutral-850 border border-neutral-850/80 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {track.coverArtUrl ? (
                      <img
                        src={track.coverArtUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music2 className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{track.title}</p>
                    <p className="text-xs text-neutral-400 truncate">
                      {track.artist} • {track.album}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0 pl-2">
                  <button
                    onClick={(e) => handleToggleFav(e, track.id)}
                    className="p-1 text-emerald-400 hover:text-white transition"
                  >
                    <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </button>
                  <span className="text-xs text-neutral-400 font-mono">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content for Playlists Tab */}
      {tab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/60 relative group"
            >
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
                <ListMusic className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-neutral-100 truncate">{pl.name}</h3>
              <p className="text-xs text-neutral-400 mt-1">{pl.trackIds.length} tracks</p>
              <button
                onClick={(e) => handleDeletePlaylist(e, pl.id)}
                className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-xl"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
