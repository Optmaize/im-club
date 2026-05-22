"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createMember, searchMembers } from "@/lib/queries";
import { createAuthUser, sendPasswordResetEmail } from "@/app/actions/auth";
import { Member, MemberStatus, MemberType } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface NewMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function NewMemberModal({ open, onClose, onCreated }: NewMemberModalProps) {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState<MemberType>("indicada");
  const [status, setStatus] = useState<MemberStatus>("pendente");
  const [indicadora, setIndicadora] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setNome(""); setCelular(""); setEmail(""); setTipo("indicada");
    setStatus("pendente"); setIndicadora(null); setSearchQuery(""); setSearchResults([]);
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    const results = await searchMembers(supabase, q);
    setSearchResults(results);
    setSearching(false);
  }

  function selectIndicadora(m: Member) {
    setIndicadora(m);
    setSearchQuery(m.cliente_nome);
    setSearchResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !celular) return;
    setSaving(true);

    const cleanedPhone = cleanPhone(celular);
    const supabase = createClient();

    // 1. Cria o membro na tabela
    const { error: memberError } = await createMember(supabase, {
      cliente_id: cleanedPhone,
      cliente_nome: nome,
      cliente_telefone: cleanedPhone,
      tipo,
      status,
      indicada_por_id: indicadora?.cliente_id ?? null,
      indicada_por_nome: indicadora?.cliente_nome ?? null,
      email: email || null,
    });

    if (memberError) {
      setSaving(false);
      toast.error("Erro ao cadastrar. Celular pode já estar cadastrado.");
      return;
    }

    // 2. Se tiver email, cria usuário no Auth e envia link de primeiro acesso
    if (email) {
      const authResult = await createAuthUser(email, cleanedPhone);
      if (authResult.error) {
        toast.warning(`Membro cadastrado, mas erro ao criar acesso: ${authResult.error}`);
      } else {
        const resetResult = await sendPasswordResetEmail(email);
        if (!resetResult.error) {
          toast.success(`${nome} cadastrada! Link de primeiro acesso enviado para ${email}`);
        } else {
          toast.success(`${nome} cadastrada! Envie o link de acesso manualmente.`);
        }
      }
    } else {
      toast.success(`${nome} cadastrada com sucesso!`);
    }

    setSaving(false);
    reset();
    onCreated();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-playfair text-ink">Novo Membro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da cliente" required />
          </div>

          <div className="space-y-1.5">
            <Label>Celular *</Label>
            <Input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="84999261688" required />
            <p className="text-xs text-muted-foreground">Apenas dígitos com DDD</p>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
            <p className="text-xs text-muted-foreground">
              Se informado, um link para criar a senha será enviado automaticamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as MemberType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicada">Indicada</SelectItem>
                  <SelectItem value="embaixadora">Embaixadora</SelectItem>
                  <SelectItem value="cliente_antiga">Cliente Antiga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status inicial</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <Label>Indicada por (opcional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nome ou celular"
                className="pl-9"
              />
              {searching && <Loader2 className="absolute right-3 top-2.5 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-beige-dark rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((m) => (
                  <button key={m.cliente_id} type="button"
                    className="w-full text-left px-3 py-2 hover:bg-beige text-sm transition-colors"
                    onClick={() => selectIndicadora(m)}
                  >
                    <span className="font-medium text-ink">{m.cliente_nome}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{m.cliente_id}</span>
                  </button>
                ))}
              </div>
            )}
            {indicadora && (
              <p className="text-xs text-emerald-600">✓ {indicadora.cliente_nome} selecionada</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-ink text-gold hover:bg-ink-light">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
