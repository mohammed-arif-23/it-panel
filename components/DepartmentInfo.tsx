"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Target, Users } from 'lucide-react';

export interface StaffItem {
  name: string;
  designation: string;
  position: string;
  imageUrl: string;
}

export interface DepartmentInfoData {
  vision: string[];
  mission: string[];
  staff: StaffItem[];
}

export function DepartmentInfoView({ data }: { data: DepartmentInfoData }) {
  const [state, setState] = useState<DepartmentInfoData>(data || { vision: [], mission: [], staff: [] });
  const [loading, setLoading] = useState(false);

  // Client-side fallback: if no data came from server, fetch on mount
  useEffect(() => {
    const isEmpty = (state.vision?.length ?? 0) === 0 && (state.mission?.length ?? 0) === 0 && (state.staff?.length ?? 0) === 0;
    if (isEmpty) {
      setLoading(true);
      fetch('/api/department-info', { cache: 'no-store' })
        .then((r) => r.json())
        .then((json) => {
          if (json?.data) setState(json.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { vision, mission, staff } = state;

  const isEmpty = (vision?.length ?? 0) === 0 && (mission?.length ?? 0) === 0 && (staff?.length ?? 0) === 0;
  const isLoadingPhase = loading || isEmpty;

  return (
    <div className="space-y-8">
      {/* Vision & Mission */}
      <Card className="rounded-2xl border border-purple-100/70 shadow-sm bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Eye className="w-5 h-5" />
                </span>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Vision</h2>
              </div>
              {isLoadingPhase ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : Array.isArray(vision) && vision.length > 1 ? (
                <ul className="list-disc ml-6 text-[var(--color-text-secondary)] space-y-1 marker:text-purple-500">
                  {vision.map((v, i) => (
                    <li key={i} className="leading-relaxed">{v}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{vision[0] ?? ''}</p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700">
                  <Target className="w-5 h-5" />
                </span>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Mission</h2>
              </div>
              {isLoadingPhase ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : Array.isArray(mission) && mission.length > 1 ? (
                <ul className="list-disc ml-6 text-[var(--color-text-secondary)] space-y-1 marker:text-fuchsia-500">
                  {mission.map((m, i) => (
                    <li key={i} className="leading-relaxed">{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{mission[0] ?? ''}</p>
              )}
            </section>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-semibold">Staff</h2>
          </div>
          <Badge variant="outline">{staff?.length || 0} Members</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {isLoadingPhase && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden rounded-2xl border border-purple-100/60 shadow-sm">
                  <CardContent className="p-0">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          {!isLoadingPhase && (staff || []).map((s, idx) => (
            <Card key={idx} className="overflow-hidden rounded-2xl border border-purple-100/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-[1/1] bg-gradient-to-br from-purple-50 to-fuchsia-50">
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold leading-tight text-[var(--color-text-primary)]">{s.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{s.designation || '—'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.position && (
                      <span className="text-md inline-flex items-center rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-medium px-2 py-1">
                        {s.position}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
