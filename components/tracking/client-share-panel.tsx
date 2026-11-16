"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/utils/use-hydrated";
import { Copy, ExternalLink, Link2, Link2Off, Mail, RefreshCw } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { DOC_TYPES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { isCleared } from "@/lib/utils/documents";
import { NOTIFY_STEPS, shareState, trackingPath } from "@/lib/utils/tracking";
import type { Mission, OperationStep } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { DetailSection } from "@/components/details/parts";

/** Réglages du partage client : le transitaire choisit ce qui est visible. */
export function ClientSharePanel({ mission: m, by, readOnly = false }: { mission: Mission; by: string; readOnly?: boolean }) {
  const { all, lookups } = useData();
  const { toast } = useToast();
  const client = lookups.company(m.clientId);
  const share = m.clientShare;
  const [email, setEmail] = useState(client?.email ?? "");
  const [note, setNote] = useState(share?.publicNote ?? "");
  const [noteFor, setNoteFor] = useState(share?.publicNote);
  const hydrated = useHydrated();
  const [notifyEmail, setNotifyEmail] = useState(share?.notifyEmail ?? "");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail.trim());
  // resynchronise le brouillon si la note change ailleurs (autre onglet)
  if (share?.publicNote !== noteFor) {
    setNoteFor(share?.publicNote);
    setNote(share?.publicNote ?? "");
  }

  if (readOnly) {
    const st = share ? shareState(share) : null;
    return (
      <DetailSection title="Partage avec le client">
        <p className="text-sm text-slate-600">
          {!share ? "Aucun lien de suivi client." : st === "actif" ? `Lien de suivi actif jusqu'au ${formatDate(share.expiresAt)}.` : st === "expire" ? "Lien de suivi expiré." : "Lien de suivi désactivé."}
        </p>
        <p className="mt-1 text-xs text-slate-400">Votre rôle ne permet pas de modifier le partage client.</p>
      </DetailSection>
    );
  }

  if (!share) {
    return (
      <DetailSection title="Partage avec le client">
        <p className="text-sm text-slate-600">
          Créez un lien de suivi à envoyer au client : il voit l&apos;étape en cours et la date estimée, sans compte ni mot de passe. Les tarifs, notes internes et coordonnées du chauffeur restent masqués.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="E-mail du client pour les notifications" className="sm:flex-1">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button
            icon={Link2}
            onClick={() => {
              actions.createClientShare(m.id, email.trim(), by);
              toast("Lien de suivi créé", { message: `${m.ref} — prêt à être envoyé au client` });
            }}
          >
            Créer le lien de suivi
          </Button>
        </div>
      </DetailSection>
    );
  }

  const state = shareState(share);
  const path = trackingPath(share.token);
  const url = hydrated ? `${window.location.origin}${path}` : path;
  const sharedDocs = all.documents.filter((d) => d.missionId === m.id && d.sharedWith.includes("client"));
  const toggleStep = (step: OperationStep) => {
    const steps = share.notifySteps.includes(step) ? share.notifySteps.filter((s) => s !== step) : [...share.notifySteps, step].sort();
    actions.updateClientShare(m.id, { notifySteps: steps });
  };

  return (
    <DetailSection
      title="Partage avec le client"
      action={state === "actif" ? <Badge tone="green">Lien actif</Badge> : state === "expire" ? <Badge tone="orange">Lien expiré</Badge> : <Badge tone="neutral">Lien désactivé</Badge>}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={url} aria-label="Lien de suivi" className="font-mono text-xs sm:flex-1" onFocus={(e) => e.target.select()} />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Copy}
            disabled={state !== "actif"}
            onClick={() => {
              navigator.clipboard?.writeText(url).then(
                () => toast("Lien copié", { message: "Collez-le dans un e-mail, un SMS ou WhatsApp." }),
                () => toast("Copie impossible", { message: "Sélectionnez le lien et copiez-le manuellement.", tone: "warning" }),
              );
            }}
          >
            Copier
          </Button>
          <a href={path} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50">
            <ExternalLink className="size-4" /> Aperçu
          </a>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Valable jusqu&apos;au {formatDate(share.expiresAt)}. Démonstration : un lien créé ici ne s&apos;ouvre que dans ce navigateur (pas de serveur).
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle checked={share.showPlate} onChange={(v) => actions.updateClientShare(m.id, { showPlate: v })} label="Afficher l'immatriculation" description="Utile pour la réception sur site." />
        <Toggle checked={share.showDriver} onChange={(v) => actions.updateClientShare(m.id, { showDriver: v })} label="Afficher le nom et le téléphone du chauffeur" description="Données personnelles : au cas par cas." />
      </div>

      <Field label="Message pour le client" hint="Affiché en tête du lien de suivi. Rédigez ou validez vous-même l'information transmise (retard, incident…)." className="mt-4">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : attente au poste frontière, nouvelle heure d'arrivée communiquée dans la journée." />
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        {share.publicNote && (
          <Button size="sm" variant="ghost" onClick={() => actions.updateClientShare(m.id, { publicNote: undefined })}>
            Retirer le message
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={note.trim() === (share.publicNote ?? "")}
          onClick={() => {
            actions.updateClientShare(m.id, { publicNote: note.trim() || undefined });
            toast("Message publié", { message: "Visible immédiatement sur le lien de suivi." });
          }}
        >
          Publier le message
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Mail className="size-4 text-slate-400" /> E-mails automatiques
        </p>
        <Input
          type="email"
          value={notifyEmail}
          invalid={!emailValid}
          onChange={(e) => setNotifyEmail(e.target.value)}
          onBlur={() => {
            if (emailValid && notifyEmail.trim() !== share.notifyEmail) {
              actions.updateClientShare(m.id, { notifyEmail: notifyEmail.trim() });
              toast("E-mail du client enregistré", { message: notifyEmail.trim() });
            }
          }}
          className="mt-2"
          aria-label="E-mail du client"
        />
        {!emailValid && <p className="mt-1 text-xs text-red-500">Adresse e-mail invalide : les notifications ne partiront pas.</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {NOTIFY_STEPS.map((n) => {
            const on = share.notifySteps.includes(n.step);
            return (
              <button key={n.step} onClick={() => toggleStep(n.step)} aria-pressed={on} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {n.label}
              </button>
            );
          })}
        </div>
        {share.sentEmails.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-slate-500">
            {[...share.sentEmails].reverse().map((e, i) => (
              <li key={e.at + i}>
                Envoyé le {formatDateTime(e.at)} à {e.to} — « {NOTIFY_STEPS.find((n) => n.step === e.step)?.label ?? `Étape ${e.step + 1}`} » <span className="text-slate-400">(simulation)</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Aucun e-mail envoyé pour le moment.</p>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        <strong className="text-slate-700">Documents visibles par le client :</strong>{" "}
        {sharedDocs.length ? sharedDocs.map((d) => `${DOC_TYPES[d.type].label}${isCleared(d) ? "" : " (après vérification)"}`).join(", ") : "aucun — cochez l'icône client dans la liste des documents."}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        <strong className="text-slate-700">Jamais visibles :</strong> tarif, transporteur, notes internes, détail brut des incidents.
      </p>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        {state === "actif" ? (
          <Button
            size="sm"
            variant="ghost"
            icon={Link2Off}
            className="text-red-600 hover:bg-red-50"
            onClick={() => {
              actions.revokeClientShare(m.id, by);
              toast("Lien désactivé", { message: "Le client ne peut plus consulter le suivi.", tone: "info" });
            }}
          >
            Désactiver le lien
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          onClick={() => {
            actions.regenerateClientShare(m.id, by);
            toast("Nouveau lien généré", { message: "L'ancien lien ne fonctionne plus." });
          }}
        >
          Générer un nouveau lien
        </Button>
      </div>
    </DetailSection>
  );
}
