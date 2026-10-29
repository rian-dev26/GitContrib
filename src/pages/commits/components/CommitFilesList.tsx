import { useState, useMemo } from 'react';
import {
  FileCode2,
  Search,
  FilePlus,
  FileEdit,
  FileX,
  Info,
} from 'lucide-react';
import { CommitFileChange } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

interface CommitFilesListProps {
  files?: CommitFileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

export function CommitFilesList({
  files = [],
  totalAdditions,
  totalDeletions,
}: CommitFilesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase().trim();
    return files.filter((f) => f.filename.toLowerCase().includes(q));
  }, [files, searchQuery]);

  return (
    <Card className="overflow-hidden border-app-border shadow-sm">
      <CardHeader className="pb-3 border-b border-app-border/60">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-app-accent-secondary/10 border border-app-accent-secondary/20 flex items-center justify-center text-app-accent-secondary">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar File yang Berubah ({files.length})
              </CardTitle>
              <p className="text-xs text-app-text-secondary">
                Rincian perubahan baris kode per file dalam commit ini
              </p>
            </div>
          </div>

          {/* Quick search in files */}
          {files.length > 3 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-app-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama file..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/40 text-app-text-primary placeholder:text-app-text-secondary/70 focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {files.length === 0 ? (
          <div className="p-8 text-center text-xs text-app-text-secondary space-y-2">
            <FileCode2 className="w-8 h-8 text-app-text-secondary/40 mx-auto" />
            <p className="font-semibold text-app-text-primary">
              Daftar file individual tidak tersedia dalam metadata commit ini.
            </p>
            <p className="text-[11px] max-w-sm mx-auto text-app-text-secondary">
              Total statistik perubahan kode tercatat: +{totalAdditions} / -{totalDeletions} baris.
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-app-text-secondary">
            Tidak ada file yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-app-border/70 font-mono text-xs">
            {filteredFiles.map((file, idx) => {
              // Tentukan status file
              let statusLabel = 'MODIFIED';
              let StatusIcon = FileEdit;
              let statusColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';

              if (file.deletions === 0 && file.additions > 0) {
                statusLabel = 'ADDED';
                StatusIcon = FilePlus;
                statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
              } else if (file.additions === 0 && file.deletions > 0) {
                statusLabel = 'DELETED';
                StatusIcon = FileX;
                statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
              }

              // Hitung proporsi visual bar additions vs deletions
              const totalFileChanges = Math.max(1, file.additions + file.deletions);
              const addPercent = (file.additions / totalFileChanges) * 100;
              const delPercent = (file.deletions / totalFileChanges) * 100;

              return (
                <div
                  key={`${file.filename}-${idx}`}
                  className="p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-app-secondary/30 transition-colors"
                >
                  {/* File name & status */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border uppercase',
                        statusColor
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel}
                    </span>
                    <span className="text-app-text-primary font-medium truncate" title={file.filename}>
                      {file.filename}
                    </span>
                  </div>

                  {/* Additions / Deletions / Mini Bar */}
                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{file.additions}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        -{file.deletions}
                      </span>
                    </div>

                    {/* Mini Visual Bar */}
                    <div className="w-20 sm:w-28 h-2 rounded-full bg-app-border overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${addPercent}%` }}
                        title={`+${file.additions}`}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${delPercent}%` }}
                        title={`-${file.deletions}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info Notice */}
        <div className="p-3.5 bg-app-secondary/30 border-t border-app-border/60 flex items-center gap-2 text-[11px] text-app-text-secondary">
          <Info className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
          <span>
            Daftar file di atas bersumber dari data commit simulasi prototype. GitContrib tidak mengarang isi baris Git diff sintetis demi menjaga integritas data.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
