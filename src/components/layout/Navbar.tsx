import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, GitPullRequest } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/repositories/${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="h-16 px-6 border-b border-app-border bg-app-sidebar/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-app-text-secondary absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cari repository PBL (misal: if-polibatam/smart-inventory)..."
            className="w-full h-9 pl-9 pr-4 rounded-md bg-app-card border border-app-border text-xs text-app-text-primary placeholder:text-app-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-app-accent-primary focus:border-app-accent-primary transition-all"
          />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-app-card border border-app-border text-xs text-app-text-secondary">
          <GitPullRequest className="w-3.5 h-3.5 text-app-accent-secondary" />
          <span>Lingkup: Git Public Repos</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/analysis')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Analisis Repo Baru
        </Button>
      </div>
    </header>
  );
}
