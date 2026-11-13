import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Music2, Disc3, User } from 'lucide-react';
import type { Track, Album, Artist } from '../../types/music';
import { getAllTracks } from '../../services/db';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';

type SearchCategory = 'all' | 'songs' | 'artists' | 'albums';

interface SearchScreenProps {
  onSelectAlbum?: (album: Album) => void;
  onSelectArtist?: (artist: Artist) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectAlbum, onSelectArtist }) => {
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    getAllTracks().then(setTracks);
  }, []);

  // Compute albums and artists index
  const { albums, artists } = useMemo(() => {
    const albumMap = new Map<string, Album>();
    const artistMap = new Map<string, Artist>();

    for (const track of tracks) {
      // Album grouping
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

      // Artist grouping
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

  // Filtered results
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { matchedTracks: [], matchedAlbums: [], matchedArtists: [] };
    }

    const matchedTracks = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );

    const matchedAlbums = albums.filter(
      (a) => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );

    const matchedArtists = artists.filter((a) => a.name.toLowerCase().includes(q));

    return { matchedTracks, matchedAlbums, matchedArtists };
  }, [query, tracks, albums, artists]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Search</h1>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, or albums..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      {query && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'songs', 'artists', 'albums'] as SearchCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider capitalize transition ${
                category === cat
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results or Empty State */}
      {!query ? (
        <div className="py-16 text-center text-neutral-400 space-y-2">
          <Search className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
          <p className="text-base font-semibold text-neutral-300">Search your music library</p>
          <p className="text-xs text-neutral-400">
            Find your favorite tracks, albums, and artists from Google Drive
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Songs Results */}
          {(category === 'all' || category === 'songs') && filtered.matchedTracks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Songs ({filtered.matchedTracks.length})</h2>
              <div className="space-y-1.5">
                {filtered.matchedTracks.slice(0, category === 'all' ? 8 : 50).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, filtered.matchedTracks)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-700/60 transition cursor-pointer"
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
                    <span className="text-xs text-neutral-400 font-mono pl-3 shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums Results */}
          {(category === 'all' || category === 'albums') && filtered.matchedAlbums.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Albums ({filtered.matchedAlbums.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.matchedAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onSelectAlbum?.(album)}
                    className="bg-neutral-900/60 hover:bg-neutral-850 p-3 rounded-xl border border-neutral-800/60 transition cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg bg-neutral-800 overflow-hidden mb-2.5 flex items-center justify-center">
                      {album.coverArtUrl ? (
                        <img
                          src={album.coverArtUrl}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc3 className="w-10 h-10 text-neutral-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-neutral-100 truncate">{album.name}</h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{album.artist}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists Results */}
          {(category === 'all' || category === 'artists') && filtered.matchedArtists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Artists ({filtered.matchedArtists.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filtered.matchedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onSelectArtist?.(artist)}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800/60 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-200 truncate">{artist.name}</p>
                      <p className="text-xs text-neutral-400">{artist.trackCount} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No matches */}
          {filtered.matchedTracks.length === 0 &&
            filtered.matchedAlbums.length === 0 &&
            filtered.matchedArtists.length === 0 && (
              <div className="py-12 text-center text-neutral-400">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
