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
import { IndicadoraSelect } from "@/components/admin/IndicadoraSelect";
import { adminCreateMember } from "@/app/actions/admin-queries";
import { createAuthUser, sendPasswordResetEmail } from "@/app/actions/auth";
import { Member, MemberStatus, MemberType } from "@/lib/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

  function reset() {
    setNome("");
    setCelular("");
    setEmail("");
    setTipo("indicada");
    setStatus("pendente");
    setIndicadora(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !celular) return;
    setSaving(true);

    const cleanedPhone = cleanPhone(celular);

    const result = await adminCreateMember({
      cliente_id: cleanedPhone,
      cliente_nome: nome,
      tipo,
      status,
      indicada_por_id: indicadora?.cliente_id ?? null,
      indicada_por_nome: indicadora?.cliente_nome ?? null,
      email: email || null,
    });

    if (!result.success) {
      setSaving(false);
      toast.error("Erro ao cadastrar. Celular pode já estar cadastrado.");
      return;
    }

    // If email provided, create auth user and send access link
    if (email) {
      const authResult = await createAuthUser(email, cleanedPhone);
      if (authResult.error) {
        toast.warning(`Membro cadastrada, mas erro ao criar acesso: ${authResult.error}`);
      } else {
        const resetResult = await sendPasswordResetEmail(email);
        if (!resetResult.error) {
          toast.success(`${nome} cadastrada! Link de acesso enviado para ${email}`);
        } else {
          toast.success(`${nome} cadastrada! Envie o link de acesso manualmente.`);
        }
      }
    } else {
      const msg =
        status === "ativo" && indicadora
          ? `${nome} cadastrada! ${indicadora.cliente_nome} recebeu 300 pontos de indicação.`
          : `${nome} cadastrada com sucesso!`;
      toast.success(msg);
    }

    setSaving(false);
    reset();
    onCreated();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-playfair text-ink">Novo Membro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome completo *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da cliente"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Celular *</Label>
            <Input
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="84999261688"
              required
            />
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
              Se informado, um link de acesso será enviado automaticamente
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

          <IndicadoraSelect value={indicadora} onChange={setIndicadora} />

          {status === "ativo" && indicadora && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✓ <strong>{indicadora.cliente_nome}</strong> receberá automaticamente <strong>300 pontos</strong> de indicação ao cadastrar.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onClose(); }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ink text-gold hover:bg-ink-light"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
