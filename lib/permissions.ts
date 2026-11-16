// ─────────────────────────────────────────────────────────────
// Rôles et droits dans l'espace entreprise (matrice du cahier des
// charges v1.1, section 6). Le prototype applique ces règles dans
// l'interface ; une version réelle doit les contrôler côté serveur.
// ─────────────────────────────────────────────────────────────
import type { AuditAction, CompanyRole } from "@/types";

export type Permission =
  | "mission.edit" // créer, modifier, affecter, supprimer
  | "mission.step" // faire avancer les étapes
  | "incident.report"
  | "request.manage" // demandes de transport
  | "share.manage" // lien de suivi client
  | "document.upload"
  | "document.review" // vérifier, valider, demander une correction, relancer
  | "price.view" // tarifs des missions
  | "invoice.view"
  | "invoice.edit"
  | "fleet.edit"
  | "export"
  | "users.manage"
  | "audit.view"
  | "message.post";

export const ROLES: Record<CompanyRole, { label: string; desc: string; twoFactorRequired: boolean }> = {
  admin: { label: "Administrateur entreprise", desc: "Tous les droits, gestion des utilisateurs", twoFactorRequired: true },
  operateur: { label: "Opérateur", desc: "Dossiers, étapes, documents, transporteurs — sans tarifs ni factures", twoFactorRequired: false },
  comptabilite: { label: "Comptabilité", desc: "Factures, paiements, tarifs et exports — sans modifier les dossiers", twoFactorRequired: true },
  lecture: { label: "Lecture seule", desc: "Consultation des dossiers, sans tarifs ni actions", twoFactorRequired: false },
};

const MATRIX: Record<CompanyRole, Permission[]> = {
  admin: ["mission.edit", "mission.step", "incident.report", "request.manage", "share.manage", "document.upload", "document.review", "price.view", "invoice.view", "invoice.edit", "fleet.edit", "export", "users.manage", "audit.view", "message.post"],
  operateur: ["mission.edit", "mission.step", "incident.report", "request.manage", "share.manage", "document.upload", "document.review", "fleet.edit", "message.post"],
  comptabilite: ["document.upload", "price.view", "invoice.view", "invoice.edit", "export", "message.post"],
  lecture: [],
};

export function roleCan(role: CompanyRole, perm: Permission): boolean {
  return MATRIX[role].includes(perm);
}

/** Lignes de la matrice affichées dans la page « Utilisateurs et accès ». */
export const MATRIX_ROWS: { label: string; perm: Permission }[] = [
  { label: "Créer et modifier les missions", perm: "mission.edit" },
  { label: "Mettre à jour les étapes", perm: "mission.step" },
  { label: "Vérifier et valider les documents", perm: "document.review" },
  { label: "Déposer un document", perm: "document.upload" },
  { label: "Demandes de transport", perm: "request.manage" },
  { label: "Lien de suivi client", perm: "share.manage" },
  { label: "Voir les tarifs", perm: "price.view" },
  { label: "Factures et paiements", perm: "invoice.edit" },
  { label: "Exporter des données", perm: "export" },
  { label: "Gérer les utilisateurs", perm: "users.manage" },
  { label: "Consulter le journal d'audit", perm: "audit.view" },
];

export const AUDIT_ACTIONS: Record<AuditAction, string> = {
  connexion: "Connexion",
  statut: "Changement de statut",
  document: "Document",
  facture: "Facture / paiement",
  partage: "Partage",
  droits: "Droits et utilisateurs",
  export: "Export",
  modification: "Modification",
};

/** Catégorie d'audit déduite du libellé d'une action tracée dans l'activité. */
export function auditActionOf(text: string): AuditAction {
  if (/factur|débours|encaissement|paiement|FA-|FT-|DB-/.test(text)) return "facture";
  if (/lien de suivi/.test(text)) return "partage";
  if (/pièce|document|déposé|« .* » au statut/.test(text)) return "document";
  if (/mis à jour .* :|passage|forcé|démarré|livré|arrivé|clôtur/.test(text)) return "statut";
  if (/droit|rôle|utilisateur|authentification/.test(text)) return "droits";
  if (/export/.test(text)) return "export";
  return "modification";
}
