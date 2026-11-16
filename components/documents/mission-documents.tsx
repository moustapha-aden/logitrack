"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";
import { actions } from "@/lib/store";
import { DOC_CATEGORIES, DOC_PARTIES, DOC_STATUS, DOC_TYPES, OPERATION_STEPS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { blockingDocs, byCatalogOrder, docProgress, isBlockingOpen, isCleared, isMissing, isOverdue, isToReview, OPERATION_KINDS, operationKind } from "@/lib/utils/documents";
import type { DocAudience, DocType, Mission, MissionDocument, OperationStep } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionMenu, type MenuItem } from "@/components/ui/dropdown";
import { Field, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DetailSection } from "@/components/details/parts";

const toKb = (bytes: number) => Math.max(1, Math.round(bytes / 1024));

/** Sélecteur de fichier partagé : le contenu n'est pas conservé dans le prototype, seuls le nom et la taille. */
export function useFilePicker(onPick: (targetId: string, file: { fileName: string; sizeKb: number }) => void, accept = "application/pdf,image/*", camera = false) {
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);
  const pick = (id: string) => {
    target.current = id;
    input.current?.click();
  };
  const element = (
    <input
      ref={input}
      type="file"
      accept={accept}
      capture={camera ? "environment" : undefined}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f && target.current) onPick(target.current, { fileName: f.name, sizeKb: toKb(f.size) });
        e.target.value = "";
      }}
    />
  );
  return { pick, element };
}

/**
 * Dépôt de pièces avec deux modes : « déposer » (à vérifier ensuite) ou « déposer et valider »
 * (l'exploitation fournit elle-même une pièce qu'elle a contrôlée). Remplacer une pièce déjà
 * vérifiée demande une confirmation, car elle repasse au statut « reçue ».
 */
export function useDocUpload(by: string) {
  const { toast } = useToast();
  const validateNext = useRef(false);
  const [replace, setReplace] = useState<{ doc: MissionDocument; validate: boolean } | null>(null);
  const { pick, element } = useFilePicker((id, file) => {
    const validate = validateNext.current;
    actions.uploadDocument(id, file, by, { validate });
    toast(validate ? "Pièce déposée et validée" : "Pièce déposée", { message: file.fileName, tone: validate ? "success" : "info" });
  });
  const start = (doc: MissionDocument, validate: boolean) => {
    validateNext.current = validate;
    pick(doc.id);
  };
  const upload = (doc: MissionDocument, validate = false) => {
    if (isCleared(doc) && !validate) setReplace({ doc, validate });
    else start(doc, validate);
  };
  const ui = (
    <>
      {element}
      <ConfirmDialog
        open={!!replace}
        onClose={() => setReplace(null)}
        tone="primary"
        title="Remplacer une pièce déjà vérifiée ?"
        message={replace ? `« ${DOC_TYPES[replace.doc.type].label} » repassera au statut « Reçue » et devra être vérifiée à nouveau. L'ancienne version reste dans l'historique.` : ""}
        confirmLabel="Choisir le fichier"
        onConfirm={() => replace && start(replace.doc, replace.validate)}
      />
    </>
  );
  return { upload, ui };
}

// ── Section « Documents » de la fiche mission ────────────────
export function MissionDocuments({ mission, docs, actor, canUpload = true, canReview = true }: { mission: Mission; docs: MissionDocument[]; actor: string; canUpload?: boolean; canReview?: boolean }) {
  const { toast } = useToast();
  const [correction, setCorrection] = useState<MissionDocument | null>(null);
  const [removing, setRemoving] = useState<MissionDocument | null>(null);
  const [adding, setAdding] = useState<DocType | "">("");
  const { upload, ui } = useDocUpload(actor);
  const list = [...docs].sort(byCatalogOrder);
  const progress = docProgress(list);
  const overdue = list.filter((d) => isOverdue(d)).length;
  const toReview = list.filter(isToReview).length;
  const blocking = list.filter((d) => isBlockingOpen(d, mission.step)).length;
  const missingTypes = (Object.keys(DOC_TYPES) as DocType[]).filter((t) => !list.some((d) => d.type === t));
  const categories = [...new Set(list.map((d) => DOC_TYPES[d.type].category))];

  return (
    <DetailSection
      title={`Documents (${progress.cleared}/${progress.total} vérifiés)`}
      action={<span className="text-[11px] text-slate-400">{OPERATION_KINDS[operationKind(mission)]}</span>}
    >
      {ui}
      <ProgressBar value={progress.pct} tone={overdue ? "orange" : progress.pct === 100 ? "green" : "blue"} />
      {(overdue > 0 || toReview > 0 || blocking > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {blocking > 0 && <Badge tone="orange">{blocking} pièce(s) bloquante(s)</Badge>}
          {overdue > 0 && <Badge tone="red">{overdue} pièce(s) en retard</Badge>}
          {toReview > 0 && <Badge tone="blue">{toReview} pièce(s) à vérifier</Badge>}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-slate-400 uppercase">{DOC_CATEGORIES[cat]}</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {list
                .filter((d) => DOC_TYPES[d.type].category === cat)
                .map((d) => (
                  <DocRow key={d.id} doc={d} missionStep={mission.step} onUpload={(v) => upload(d, v)} onCorrection={() => setCorrection(d)} onRemove={() => setRemoving(d)} canUpload={canUpload} canReview={canReview} />
                ))}
            </ul>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-slate-500">Aucune pièce attendue pour cette mission.</p>}
      </div>

      {missingTypes.length > 0 && canReview && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-500">Une pièce supplémentaire est nécessaire pour ce dossier ? Ajoutez-la à la checklist, puis déposez le fichier sur sa ligne.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={adding} onChange={(e) => setAdding(e.target.value as DocType | "")} aria-label="Ajouter une pièce" className="sm:flex-1">
              <option value="">Choisir une pièce à ajouter…</option>
              {missingTypes.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPES[t].label}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              icon={Plus}
              disabled={!adding}
              onClick={() => {
                if (!adding) return;
                actions.addDocument(mission.id, adding);
                toast("Pièce ajoutée à la checklist", { message: `${DOC_TYPES[adding].label} — déposez maintenant le fichier sur sa ligne.` });
                setAdding("");
              }}
            >
              Ajouter à la checklist
            </Button>
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-slate-400">Démonstration : seuls le nom et la taille du fichier sont enregistrés.</p>

      <CorrectionModal doc={correction} onClose={() => setCorrection(null)} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Retirer cette pièce de la checklist ?"
        message={removing ? `« ${DOC_TYPES[removing.type].label} » ne sera plus attendue sur ce dossier. L'action est tracée dans le journal d'audit.` : ""}
        confirmLabel="Retirer"
        onConfirm={() => {
          if (!removing) return;
          actions.removeDocument(removing.id);
          toast("Pièce retirée", { message: DOC_TYPES[removing.type].label, tone: "info" });
        }}
      />
    </DetailSection>
  );
}

function ShareToggle({ doc, audience, disabled }: { doc: MissionDocument; audience: DocAudience; disabled?: boolean }) {
  const on = doc.sharedWith.includes(audience);
  const Icon = audience === "client" ? Building2 : Truck;
  const label = audience === "client" ? "client" : "transporteur";
  return (
    <button
      disabled={disabled}
      onClick={() => actions.setDocumentSharing(doc.id, on ? doc.sharedWith.filter((a) => a !== audience) : [...doc.sharedWith, audience])}
      className={cn("inline-flex size-9 items-center justify-center rounded-lg border transition disabled:cursor-default sm:size-7", on ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-300 hover:text-slate-500")}
      title={on ? `Partagée avec le ${label}${disabled ? "" : " — cliquer pour retirer"}` : `Non partagée avec le ${label}${disabled ? "" : " — cliquer pour partager"}`}
      aria-pressed={on}
      aria-label={`Partage ${label}`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

/** Actions principales visibles sur la ligne (plus seulement dans le menu « ⋯ »). */
export function DocPrimaryActions({ doc, canUpload, canReview, onUpload }: { doc: MissionDocument; canUpload: boolean; canReview: boolean; onUpload: (validate: boolean) => void }) {
  const { toast } = useToast();
  const label = DOC_TYPES[doc.type].label;
  const missing = isMissing(doc);
  return (
    <>
      {missing && canReview && (
        <Button size="sm" variant="primary" icon={Upload} onClick={() => onUpload(true)} title="Vous avez la pièce : déposez-la, elle est validée directement.">
          Déposer et valider
        </Button>
      )}
      {missing && canUpload && !canReview && (
        <Button size="sm" variant="secondary" icon={Upload} onClick={() => onUpload(false)}>
          Déposer
        </Button>
      )}
      {canReview && doc.status === "recu" && (
        <Button
          size="sm"
          variant="secondary"
          icon={ShieldCheck}
          onClick={() => {
            actions.setDocumentStatus(doc.id, "verifie");
            toast("Pièce vérifiée", { message: label });
          }}
        >
          Vérifier
        </Button>
      )}
      {canReview && (doc.status === "recu" || doc.status === "verifie") && (
        <Button
          size="sm"
          variant="success"
          icon={CheckCircle2}
          onClick={() => {
            actions.setDocumentStatus(doc.id, "valide");
            toast("Pièce validée", { message: label, tone: "success" });
          }}
        >
          Valider
        </Button>
      )}
    </>
  );
}

function DocRow({
  doc,
  missionStep,
  onUpload,
  onCorrection,
  onRemove,
  canUpload,
  canReview,
}: {
  doc: MissionDocument;
  missionStep: OperationStep;
  onUpload: (validate: boolean) => void;
  onCorrection: () => void;
  onRemove: () => void;
  canUpload: boolean;
  canReview: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const meta = DOC_TYPES[doc.type];
  const overdue = isOverdue(doc);
  const blocking = isBlockingOpen(doc, missionStep);
  const last = doc.versions.at(-1);
  const menu = [
    canUpload && doc.versions.length > 0 && { label: "Déposer une nouvelle version", icon: Upload, onClick: () => onUpload(false) },
    canUpload && canReview && isMissing(doc) && { label: "Déposer (à vérifier plus tard)", icon: Upload, onClick: () => onUpload(false) },
    canReview && doc.versions.length > 0 && doc.status !== "a_corriger" && { label: "Demander une correction", icon: XCircle, onClick: onCorrection },
    canReview && isMissing(doc) && {
      label: `Relancer (${DOC_PARTIES[doc.responsible].toLowerCase()})`,
      icon: BellRing,
      onClick: () => {
        actions.requestDocument(doc.id);
        toast("Relance enregistrée", { message: `${meta.label} — ${DOC_PARTIES[doc.responsible]}` });
      },
    },
    doc.versions.length > 0 && { label: open ? "Masquer l'historique" : "Historique des versions", icon: ChevronDown, onClick: () => setOpen((v) => !v) },
    canReview && doc.versions.length === 0 && doc.blocksStep === null && { label: "Retirer de la checklist", icon: Trash2, danger: true, onClick: onRemove },
  ].filter(Boolean) as MenuItem[];

  return (
    <li className="px-3 py-2.5">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 sm:flex-nowrap">
        <FileText className={cn("mt-0.5 size-4 shrink-0", doc.status === "valide" ? "text-success-600" : overdue || doc.status === "a_corriger" ? "text-red-500" : "text-slate-400")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{meta.label}</span>
            <StatusBadge map={DOC_STATUS} value={doc.status} />
            {overdue && <Badge tone="red">En retard</Badge>}
            {blocking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700" title="Étape bloquée tant que la pièce n'est pas vérifiée">
                <Lock className="size-3" /> Bloque « {OPERATION_STEPS[doc.blocksStep!].short} »
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs [overflow-wrap:anywhere] text-slate-500">
            Fournie par : {DOC_PARTIES[doc.responsible].toLowerCase()}
            {doc.dueAt && !isCleared(doc) && <> · échéance {formatDateTime(doc.dueAt)}</>}
            {last && (
              <>
                {" "}
                · {last.fileName} ({doc.versions.length > 1 ? `v${doc.versions.length}, ` : ""}
                {formatDateTime(last.at)})
              </>
            )}
          </p>
          {doc.status === "a_corriger" && doc.note && <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{doc.note}</p>}
          {doc.blockedNotifiedAt && blocking && <p className="mt-1 text-[11px] font-medium text-amber-700">Le chauffeur ou le transporteur attend cette pièce (signalé le {formatDateTime(doc.blockedNotifiedAt)}).</p>}
          {doc.requestedAt && isMissing(doc) && <p className="mt-0.5 text-[11px] text-slate-400">Relancée le {formatDateTime(doc.requestedAt)}</p>}
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-1.5 pl-7 sm:w-auto sm:shrink-0 sm:pl-0">
          <DocPrimaryActions doc={doc} canUpload={canUpload} canReview={canReview} onUpload={onUpload} />
          <ShareToggle doc={doc} audience="transporteur" disabled={!canReview} />
          <ShareToggle doc={doc} audience="client" disabled={!canReview} />
          {menu.length > 0 && <ActionMenu items={menu} />}
        </div>
      </div>
      {open && doc.versions.length > 0 && (
        <ol className="mt-2 ml-7 space-y-1 border-l border-slate-200 pl-3">
          {[...doc.versions].reverse().map((v, i) => (
            <li key={v.at + i} className="text-xs [overflow-wrap:anywhere] text-slate-500">
              <span className="font-medium text-slate-700">v{doc.versions.length - i}</span> · {v.fileName} · {v.sizeKb} Ko · {v.by} · {formatDateTime(v.at)}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

export function CorrectionModal({ doc, onClose }: { doc: MissionDocument | null; onClose: () => void }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const close = () => {
    setNote("");
    onClose();
  };
  return (
    <Modal
      open={!!doc}
      onClose={close}
      size="sm"
      title="Demander une correction"
      description={doc ? DOC_TYPES[doc.type].label : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Annuler
          </Button>
          <Button
            variant="danger"
            disabled={note.trim().length < 5}
            onClick={() => {
              if (!doc) return;
              actions.setDocumentStatus(doc.id, "a_corriger", note.trim());
              toast("Correction demandée", { message: `${DOC_TYPES[doc.type].label} — ${DOC_PARTIES[doc.responsible]}`, tone: "warning" });
              close();
            }}
          >
            Envoyer la demande
          </Button>
        </>
      }
    >
      <Field label="Motif" required hint="Visible par le déposant et tracé dans l'historique.">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : montant différent de la liste de colisage" />
      </Field>
    </Modal>
  );
}

// ── Passage d'étape bloqué par des pièces ────────────────────
/** Liste les pièces bloquantes, permet de les régulariser sur place, sinon de forcer avec justification. */
export function ForceStepModal({
  mission,
  docs,
  target,
  actor,
  canReview = true,
  onClose,
  onProceed,
  onForce,
}: {
  mission: Mission;
  docs: MissionDocument[];
  target: OperationStep | null;
  actor: string;
  canReview?: boolean;
  onClose: () => void;
  onProceed: (step: OperationStep) => void;
  onForce: (step: OperationStep, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const { upload, ui } = useDocUpload(actor);
  const blockers = target === null ? [] : blockingDocs(docs, mission.id, mission.step, target);
  const close = () => {
    setReason("");
    onClose();
  };
  const cleared = target !== null && blockers.length === 0;
  return (
    <Modal
      open={target !== null}
      onClose={close}
      size="sm"
      title={cleared ? "Pièces régularisées" : "Pièces à régulariser"}
      description={target !== null ? `Passage à « ${OPERATION_STEPS[target].label} »` : undefined}
      footer={
        cleared ? (
          <Button
            icon={CheckCircle2}
            variant="success"
            onClick={() => {
              if (target !== null) onProceed(target);
              close();
            }}
          >
            Passer à l&apos;étape
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Attendre les pièces
            </Button>
            <Button
              variant="danger"
              icon={AlertTriangle}
              disabled={reason.trim().length < 5}
              onClick={() => {
                if (target === null) return;
                onForce(target, reason.trim());
                close();
              }}
            >
              Forcer le passage
            </Button>
          </>
        )
      }
    >
      {ui}
      {cleared ? (
        <p className="text-sm text-slate-600">Toutes les pièces nécessaires sont vérifiées. Vous pouvez passer à l&apos;étape.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Ces pièces doivent être vérifiées avant cette étape. Régularisez-les ici :</p>
          <ul className="mt-2 space-y-1.5">
            {blockers.map((d) => (
              <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Lock className="size-3.5 text-amber-600" /> {DOC_TYPES[d.type].label}
                  </span>
                  <StatusBadge map={DOC_STATUS} value={d.status} />
                </div>
                {canReview && (
                  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                    <DocPrimaryActions doc={d} canUpload canReview onUpload={(v) => upload(d, v)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Field label="Sinon, justification du passage forcé" required hint="Tracée dans l'historique de la mission." className="mt-4">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : BAE confirmé par téléphone par la douane, original en cours" />
          </Field>
        </>
      )}
    </Modal>
  );
}
