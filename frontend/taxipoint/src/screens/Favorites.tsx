import React, { useEffect, useState } from 'react';
import { Heart, MapPin, Navigation, Phone, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

interface User {
  token: string;
}

interface TaxiRank {
  id: string;
  name: string;
  address: string;
  district: string;
  routesServed: string[];
  phone: string;
}

const Favorites: React.FC<{ user: User }> = ({ user }) => {
  const [favorites, setFavorites] = useState<TaxiRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error('Unable to load favourites');
      setFavorites(await response.json());
    } catch {
      toast.error('Could not load your favourites.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
  }, [user.token]);

  const removeFavorite = async (rank: TaxiRank) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites/${rank.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error('Unable to remove favourite');
      setFavorites((current) => current.filter((item) => item.id !== rank.id));
      toast.success(`${rank.name} removed from favourites`);
    } catch {
      toast.error('Could not remove this favourite.');
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">Loading your favourites...</div>;
  }

  return (
    <main className="h-full w-full overflow-y-auto">
      <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 text-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-gray-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-16 text-white sm:py-20">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Heart size={38} fill="currentColor" />
            </div>
            <h1 className="mb-4 text-5xl font-bold md:text-6xl">Favourites</h1>
            <p className="mx-auto max-w-2xl text-xl text-blue-100 md:text-2xl">
              Save the taxi ranks you use most for quick access whenever you travel.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-6 flex justify-end">
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">{favorites.length} saved</span>
          </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white/80 px-6 py-16 text-center shadow-sm dark:border-blue-900 dark:bg-gray-900/70">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Heart size={26} /></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No favourites yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">Open a taxi rank on the map and tap the heart icon to save it here for quick access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {favorites.map((rank) => (
              <article key={rank.id} className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{rank.district}</p>
                    <h2 className="mt-1 truncate text-xl font-bold text-gray-900 dark:text-white">{rank.name}</h2>
                    <p className="mt-2 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400"><MapPin size={16} className="mt-0.5 shrink-0 text-blue-500" />{rank.address}</p>
                  </div>
                  <button type="button" onClick={() => void removeFavorite(rank)} className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Remove ${rank.name} from favourites`}><Trash2 size={18} /></button>
                </div>

                {rank.routesServed?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{rank.routesServed.slice(0, 4).map((route) => <span key={route} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{route}</span>)}</div>}

                <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(rank.address)}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"><Navigation size={16} /> Directions</a>
                  {rank.phone && <a href={`tel:${rank.phone}`} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"><Phone size={16} /> Call</a>}
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  );
};

export default Favorites;
