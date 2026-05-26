"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAuthUser,
  setMemberPassword,
  sendMagicLink,
  sendPasswordResetEmail,
  updateMemberEmail,
} from "@/app/actions/auth";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  KeyRound,
  Link2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";

interface Props {
  clienteId: string;
  clienteNome: string;
  email: string | null;
  authUserId: string | null;
  onUpdated: () => void;
}

export function MemberAccessPanel({
  clienteId,
  clienteNome,
  email: initialEmail,
  authUserId: initialAuthUserId,
  onUpdated,
}: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [authUserId, setAuthUserId] = useState(initialAuthUserId);
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [emailInput, setEmailInput] = useState(initialEmail ?? "");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);

  const [loading, setLoading] = useState<string | null>(null); // action key being run

  // ── Email ──────────────────────────────────────────────────────────────────

  async function handleSaveEmail() {
    if (!emailInput.trim()) return;
    setLoading("email");
    const result = await updateMemberEmail(clienteId, authUserId, emailInput.trim());
    setLoading(null);
    if (!result.success) {
      toast.error(result.error ?? "Erro ao salvar email");
      return;
    }
    setEmail(emailInput.trim());
    setEditingEmail(false);
    toast.success("Email atualizado!");
    onUpdated();
  }

  // ── Create access ──────────────────────────────────────────────────────────

  async function handleCreateAccess() {
    if (!email) return;
    setLoading("create");
    const result = await createAuthUser(email, clienteId);
    setLoading(null);
    if (result.error) {
      toast.error(`Erro ao criar acesso: ${result.error}`);
      return;
    }
    setAuthUserId(result.userId ?? null);
    toast.success(`Acesso criado para ${clienteNome}!`);
    onUpdated();
  }

  // ── Set password ───────────────────────────────────────────────────────────

  async function handleSetPassword() {
    if (!authUserId || !password.trim()) return;
    if (password.length < 6) {
      toast.error("Senha precisa ter ao menos 6 caracteres");
      return;
    }
    setLoading("password");
    const result = await setMemberPassword(authUserId, password.trim());
    setLoading(null);
    if (!result.success) {
      toast.error(result.error ?? "Erro ao definir senha");
      return;
    }
    setPassword("");
    setPasswordSection(false);
    toast.success(
      `Senha definida! Informe à ${clienteNome}: login com ${email} e a nova senha.`
    );
  }

  // ── Send magic link ────────────────────────────────────────────────────────

  async function handleSendMagicLink() {
    if (!email) return;
    setLoading("magic");
    const result = await sendMagicLink(email);
    setLoading(null);
    if (result.error) {
      toast.error(`Erro ao enviar link: ${result.error}`);
      return;
    }
    toast.success(`Link de acesso enviado para ${email}!`);
  }

  // ── Send reset ─────────────────────────────────────────────────────────────

  async function handleSendReset() {
    if (!email) return;
    setLoading("reset");
    const result = await sendPasswordResetEmail(email);
    setLoading(null);
    if (result.error) {
      toast.error(`Erro ao enviar email: ${result.error}`);
      return;
    }
    toast.success(`Email para redefinir senha enviado para ${email}!`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isSpinning = (key: string) =>
    loading === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-beige p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-gold" />
        <span className="text-sm font-semibold text-ink">Acesso ao Portal</span>
        {authUserId && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            Ativo
          </span>
        )}
        {email && !authUserId && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            Sem acesso
          </span>
        )}
      </div>

      {/* ── Email ── */}
      {editingEmail ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleSaveEmail}
              disabled={!emailInput.trim() || loading === "email"}
              className="bg-ink text-gold hover:bg-ink-light h-8 px-3 flex-shrink-0"
            >
              {isSpinning("email") ?? "Salvar"}
            </Button>
            {email && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEmailInput(email); setEditingEmail(false); }}
                className="h-8 px-2 flex-shrink-0"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink truncate flex-1">{email}</span>
          <button
            onClick={() => { setEmailInput(email); setEditingEmail(true); }}
            className="text-muted-foreground hover:text-ink transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Create access (when email set but no auth) ── */}
      {email && !authUserId && !editingEmail && (
        <Button
          onClick={handleCreateAccess}
          disabled={loading === "create"}
          className="w-full bg-ink text-gold hover:bg-ink-light h-8 text-xs gap-1.5"
          size="sm"
        >
          {isSpinning("create") ?? <KeyRound className="w-3.5 h-3.5" />}
          Criar acesso
        </Button>
      )}

      {/* ── Actions (when auth exists) ── */}
      {authUserId && (
        <div className="space-y-2">
          {/* Set password inline */}
          {passwordSection ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Nova senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="mín. 6 caracteres"
                    className="h-8 text-sm pr-8"
                    onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-ink"
                  >
                    {showPassword
                      ? <EyeOff className="w-3.5 h-3.5" />
                      : <Eye className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSetPassword}
                  disabled={!password || loading === "password"}
                  className="bg-ink text-gold hover:bg-ink-light h-8 px-3 flex-shrink-0"
                >
                  {isSpinning("password") ?? "Salvar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setPasswordSection(false); setPassword(""); }}
                  className="h-8 px-2 flex-shrink-0"
                >
                  ✕
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPasswordSection(true)}
                className="h-8 text-xs gap-1 col-span-1"
              >
                <KeyRound className="w-3 h-3" />
                Senha
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendMagicLink}
                disabled={loading === "magic"}
                className="h-8 text-xs gap-1 col-span-1"
              >
                {isSpinning("magic") ?? <Link2 className="w-3 h-3" />}
                Magic link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendReset}
                disabled={loading === "reset"}
                className="h-8 text-xs gap-1 col-span-1"
              >
                {isSpinning("reset") ?? <Mail className="w-3 h-3" />}
                Reset email
              </Button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>Senha:</strong> você define aqui e comunica à cliente. &nbsp;
            <strong>Magic link:</strong> envia email de acesso único. &nbsp;
            <strong>Reset:</strong> a cliente redefine a própria senha.
          </p>
        </div>
      )}

      {/* ── No email yet ── */}
      {!email && !editingEmail && (
        <p className="text-xs text-muted-foreground">
          Adicione um email para liberar o acesso ao portal.
        </p>
      )}
    </div>
  );
}
