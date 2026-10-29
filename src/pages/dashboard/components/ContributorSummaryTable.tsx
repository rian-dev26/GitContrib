import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, ArrowRight, User } from 'lucide-react';
import { DashboardContributorItem } from '../../../types/dashboard';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface ContributorSummaryTableProps {
  contributors: DashboardContributorItem[];
}

export function ContributorSummaryTable({ contributors }: ContributorSummaryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredContributors = contributors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-app-accent-secondary" />
          <CardTitle className="text-sm">Ringkasan Aktivitas Contributor</CardTitle>
        </div>

        {/* Search input & All contributors link */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-app-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mahasiswa..."
              aria-label="Cari nama atau username kontributor"
              className="w-full h-8 pl-8 pr-2.5 rounded-md bg-app-secondary/60 border border-app-border text-xs text-app-text-primary placeholder:text-app-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-app-accent-primary transition-colors"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contributors/demo')}
            className="text-xs shrink-0"
            rightIcon={<ArrowRight className="w-3 h-3" />}
          >
            Lihat Semua
          </Button>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-app-secondary/40 text-app-text-secondary border-b border-app-border font-medium">
            <tr>
              <th scope="col" className="py-3 px-4">Contributor</th>
              <th scope="col" className="py-3 px-3 text-center">Total Commit</th>
              <th scope="col" className="py-3 px-3 text-center">Hari Aktif</th>
              <th scope="col" className="py-3 px-3 text-right">Baris Ditambah</th>
              <th scope="col" className="py-3 px-3 text-right">Baris Dihapus</th>
              <th scope="col" className="py-3 px-3 text-center">Prediksi YES</th>
              <th scope="col" className="py-3 px-3 text-center">Prediksi NO</th>
              <th scope="col" className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {filteredContributors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-app-text-secondary">
                  Tidak ada data contributor yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                </td>
              </tr>
            ) : (
              filteredContributors.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/contributors/${c.id}`)}
                  className="hover:bg-app-secondary/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-medium text-app-text-primary">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-app-secondary flex items-center justify-center text-app-text-secondary border border-app-border shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold group-hover:text-app-accent-primary transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-app-text-secondary truncate">
                          @{c.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-medium text-app-text-primary">
                    {c.totalCommits}
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-app-text-secondary">
                    {c.activeDays} hari
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-emerald-500 dark:text-emerald-400 font-medium">
                    +{c.linesAdded.toLocaleString('id-ID')}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-rose-500 dark:text-rose-400 font-medium">
                    -{c.linesDeleted.toLocaleString('id-ID')}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-500 dark:text-emerald-400">
                    {c.yesCount}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-semibold text-rose-500 dark:text-rose-400">
                    {c.noCount}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/contributors/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-app-accent-primary hover:underline font-medium"
                    >
                      Detail
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 bg-app-secondary/20 border-t border-app-border text-[11px] text-app-text-secondary">
        *Rincian angka aktivitas Git di atas dihimpun dari histori commit dan bukan evaluasi nilai akademik.
      </div>
    </Card>
  );
}
