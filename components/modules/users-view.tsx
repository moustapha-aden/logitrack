"use client";

import { useState } from "react";
import { Check, KeyRound, Minus, ShieldAlert, UserPlus } from "lucide-react";
import { actions } from "@/lib/store";
import { useData, usePermissions } from "@/lib/store/selectors";
import { MATRIX_ROWS, roleCan, ROLES } from "@/lib/permissions";
import { cn, formatDateTime } from "@/lib/utils";
import type { CompanyRole, CompanyUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { AccessDenied, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

const ROLE_KEYS = Object.keys(ROLES) as CompanyRole[];

function InviteModal({ companyId, domain, onClose }: { companyId: string; domain: string; onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyRole>("operateur");
  const valid = name.trim().length >= 3 && /.+@.+\..+/.test(email);
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Inviter un utilisateur"
      description="Démonstration : aucun e-mail d'invitation n'est réellement envoyé."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            icon={UserPlus}
            disabled={!valid}
            onClick={() => {
              const user: CompanyUser = { id: actions.newUserId(), companyId, name: name.trim(), email: email.trim(), role, active: true, twoFactor: false, createdAt: new Date().toISOString() };
              actions.saveUser(user);
              toast("Utilisateur invité", { message: `${user.name} — ${ROLES[role].label}` });
              onClose();
            }}
          >
            Inviter
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Nom complet" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-mail professionnel" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`prenom@${domain}`} />
        </Field>
        <Field label="Rôle" hint={ROLES[role].desc}>
          <Select value={role} onChange={(e) => setRole(e.target.value as CompanyRole)}>
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>
                {ROLES[r].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

export function UsersView() {
  const { all, lookups, scope } = useData();
  const perms = usePermissions();
  const { toast } = useToast();
  const [invite, setInvite] = useState(false);
  const [deactivate, setDeactivate] = useState<CompanyUser | null>(null);
  if (!scope || !perms.can("users.manage")) return <AccessDenied />;

  const company = lookups.company(scope);
  const team = all.users.filter((u) => u.companyId === scope).sort((a, b) => ROLE_KEYS.indexOf(a.role) - ROLE_KEYS.indexOf(b.role));
  const activeAdmins = team.filter((u) => u.role === "admin" && u.active);
  // on ne retire jamais le dernier administrateur actif (l'entreprise perdrait la main sur ses accès)
  const isLastAdmin = (u: CompanyUser) => u.role === "admin" && u.active && activeAdmins.length === 1;
  const missing2fa = team.filter((u) => u.active && ROLES[u.role].twoFactorRequired && !u.twoFactor);

  return (
    <div>
      <PageHeader
        eyebrow="Sécurité"
        title="Utilisateurs et accès"
        description={`Comptes de ${company?.name ?? "l'entreprise"}, rôles et double authentification. Chaque changement est inscrit au journal d'audit.`}
        actions={
          <Button icon={UserPlus} onClick={() => setInvite(true)}>
            Inviter un utilisateur
          </Button>
        }
      />

      {missing2fa.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <p>
            <strong>Double authentification requise</strong> pour {missing2fa.map((u) => `${u.name} (${ROLES[u.role].label})`).join(", ")}. Les rôles administrateur et comptabilité accèdent aux tarifs et aux factures.
          </p>
        </div>
      )}

      <Card>
        <ul className="divide-y divide-slate-100">
          {team.map((u) => {
            const me = u.id === perms.user?.id;
            const locked = isLastAdmin(u);
            return (
              <li key={u.id} className={cn("flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center", !u.active && "bg-slate-50/70")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("font-medium", !u.active && "text-slate-400 line-through")}>{u.name}</p>
                    {me && <Badge tone="blue">Vous</Badge>}
                    {!u.active && <Badge tone="neutral">Désactivé</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {u.email} · dernière connexion {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "jamais"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={u.role}
                    disabled={locked || !u.active}
                    onChange={(e) => {
                      actions.setUserRole(u.id, e.target.value as CompanyRole);
                      toast("Rôle modifié", { message: `${u.name} — ${ROLES[e.target.value as CompanyRole].label}` });
                    }}
                    aria-label={`Rôle de ${u.name}`}
                    className="h-9 w-56 text-sm"
                    title={locked ? "Dernier administrateur actif : rôle verrouillé" : undefined}
                  >
                    {ROLE_KEYS.map((r) => (
                      <option key={r} value={r}>
                        {ROLES[r].label}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => {
                      actions.setUserTwoFactor(u.id, !u.twoFactor);
                      toast(u.twoFactor ? "Double authentification désactivée" : "Double authentification activée", { message: u.name, tone: u.twoFactor ? "warning" : "success" });
                    }}
                    disabled={!u.active}
                    className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition", u.twoFactor ? "border-success-600/30 bg-success-50 text-success-700" : ROLES[u.role].twoFactorRequired ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                  >
                    <KeyRound className="size-3.5" /> {u.twoFactor ? "2FA activée" : ROLES[u.role].twoFactorRequired ? "2FA requise" : "2FA désactivée"}
                  </button>
                  {u.active ? (
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" disabled={locked || me} onClick={() => setDeactivate(u)} title={me ? "Vous ne pouvez pas désactiver votre propre compte" : locked ? "Dernier administrateur actif" : undefined}>
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        actions.setUserActive(u.id, true);
                        toast("Compte réactivé", { message: u.name });
                      }}
                    >
                      Réactiver
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Matrice des droits" subtitle="Appliquée dans l'interface du prototype ; une version réelle la contrôle côté serveur." />
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-3 font-medium">Action</th>
                {ROLE_KEYS.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">
                    {ROLES[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX_ROWS.map((row) => (
                <tr key={row.perm}>
                  <td className="py-2 pr-3 text-slate-700">{row.label}</td>
                  {ROLE_KEYS.map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {roleCan(r, row.perm) ? <Check className="mx-auto size-4 text-success-600" aria-label="Oui" /> : <Minus className="mx-auto size-4 text-slate-300" aria-label="Non" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {invite && company && <InviteModal companyId={company.id} domain={company.email.split("@")[1]} onClose={() => setInvite(false)} />}
      <ConfirmDialog
        open={!!deactivate}
        onClose={() => setDeactivate(null)}
        title="Désactiver ce compte ?"
        message={deactivate ? `${deactivate.name} perd immédiatement l'accès à l'espace, y compris s'il est connecté. Le compte et son historique sont conservés.` : ""}
        confirmLabel="Désactiver"
        onConfirm={() => {
          if (!deactivate) return;
          actions.setUserActive(deactivate.id, false);
          toast("Compte désactivé", { message: `${deactivate.name} — accès retiré`, tone: "warning" });
        }}
      />
    </div>
  );
}
