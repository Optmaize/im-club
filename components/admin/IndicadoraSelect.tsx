"use client";

import { useState, useEffect } from "react";
import { Member } from "@/lib/types";
import { searchMembers } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, X, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks";

interface Props {
  value: Member | null;
  onChange: (member: Member | null) => void;
  label?: string;
  className?: string;
}

export function IndicadoraSelect({ value, onChange, label = "Indicada por", className }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Reset query when value is cleared externally
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  useEffect(() => {
    if (value || debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    searchMembers(createClient(), debouncedQuery).then((r) => {
      setResults(r);
      setOpen(r.length > 0);
      setSearching(false);
    });
  }, [debouncedQuery, value]);

  function handleSelect(m: Member) {
    onChange(m);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className={`space-y-1.5 relative ${className ?? ""}`}>
      <Label className="text-xs">{label} <span className="text-muted-foreground font-normal">(opcional)</span></Label>

      {value ? (
        /* ── Selected state ── */
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-ink">{value.cliente_nome}</span>
            <span className="text-xs text-muted-foreground ml-2">{value.cliente_id}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-ink transition-colors p-0.5 rounded"
            aria-label="Remover indicadora"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ── Search state ── */
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(false); }}
              onFocus={() => { if (results.length > 0) setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Buscar membro por nome ou celular..."
              className="pl-8 h-9 text-sm"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-0.5 left-0 right-0 bg-white border border-beige rounded-lg shadow-lg max-h-44 overflow-y-auto">
              {results.map((m) => (
                <button
                  key={m.cliente_id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-beige text-sm transition-colors border-b border-beige last:border-0"
                  onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                  onClick={() => handleSelect(m)}
                >
                  <span className="font-medium text-ink">{m.cliente_nome}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{m.cliente_id}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
