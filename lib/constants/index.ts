import type {
  CarrierStatus,
  CompanyType,
  DocCategory,
  DocParty,
  DocStatus,
  DocType,
  DriverAvailability,
  GoodsType,
  IncidentStatus,
  IncidentType,
  LoadStatus,
  MissionStatus,
  NotificationKind,
  OperationStep,
  Severity,
  TruckStatus,
  TruckType,
} from "@/types";

export const APP_NAME = "LogiTrack";
export const SLOGAN = "Pilotez vos transports. Maîtrisez votre logistique.";

/** Date de référence de la démonstration (données fictives). */
export const DEMO_NOW = "2026-11-08T10:30:00+03:00";
export const TIME_ZONE = "Africa/Djibouti";

export type Tone = "neutral" | "blue" | "green" | "orange" | "red" | "navy" | "violet";

export interface Meta {
  label: string;
  tone: Tone;
}

export const OPERATION_STEPS: { step: OperationStep; label: string; short: string; actor: string }[] = [
  { step: 0, label: "Mission créée", short: "Créée", actor: "Exploitation" },
  { step: 1, label: "En attente de chargement", short: "Attente", actor: "Exploitation" },
  { step: 2, label: "Chargement en cours", short: "Chargement", actor: "Chauffeur" },
  { step: 3, label: "Chargement terminé", short: "Chargé", actor: "Chauffeur" },
  { step: 4, label: "En transit", short: "Transit", actor: "Chauffeur" },
  { step: 5, label: "Arrivée à destination", short: "Arrivée", actor: "Chauffeur" },
  { step: 6, label: "Livraison effectuée", short: "Livrée", actor: "Chauffeur" },
  { step: 7, label: "Mission clôturée", short: "Clôturée", actor: "Exploitation" },
];

export const MISSION_STATUS: Record<MissionStatus, Meta> = {
  planifiee: { label: "Planifiée", tone: "neutral" },
  en_cours: { label: "En cours", tone: "blue" },
  en_retard: { label: "En retard", tone: "orange" },
  terminee: { label: "Terminée", tone: "green" },
};

export const TRUCK_STATUS: Record<TruckStatus, Meta> = {
  disponible: { label: "Disponible", tone: "green" },
  en_mission: { label: "En mission", tone: "blue" },
  maintenance: { label: "En maintenance", tone: "orange" },
  immobilise: { label: "Immobilisé", tone: "red" },
};

export const TRUCK_TYPES: Record<TruckType, string> = {
  plateau: "Camion plateau",
  citerne: "Camion-citerne",
  porte_conteneur: "Porte-conteneur",
  frigorifique: "Camion frigorifique",
  semi_remorque: "Semi-remorque",
};

export const DRIVER_AVAILABILITY: Record<DriverAvailability, Meta> = {
  disponible: { label: "Disponible", tone: "green" },
  en_mission: { label: "En mission", tone: "blue" },
  repos: { label: "En repos", tone: "neutral" },
  conge: { label: "En congé", tone: "violet" },
};

export const COMPANY_TYPES: Record<CompanyType, Meta> = {
  transport: { label: "Transporteur", tone: "blue" },
  transit: { label: "Transitaire", tone: "violet" },
  logistique: { label: "Logistique", tone: "navy" },
  client: { label: "Client chargeur", tone: "green" },
};

export const ACTIVE_STATUS: Record<"actif" | "inactif", Meta> = {
  actif: { label: "Actif", tone: "green" },
  inactif: { label: "Inactif", tone: "neutral" },
};

export const CARRIER_STATUS: Record<CarrierStatus, Meta> = {
  actif: { label: "Actif", tone: "green" },
  inactif: { label: "Inactif", tone: "neutral" },
  suspendu: { label: "Suspendu", tone: "red" },
};

export const GOODS_TYPES: Record<GoodsType, string> = {
  conteneurs: "Conteneurs",
  hydrocarbures: "Hydrocarbures",
  vrac: "Vrac (céréales, engrais)",
  denrees: "Denrées alimentaires",
  materiaux: "Matériaux de construction",
  equipements: "Équipements industriels",
  frigorifique: "Produits frais / réfrigérés",
};

export const LOAD_STATUS: Record<LoadStatus, Meta> = {
  en_attente: { label: "En attente", tone: "neutral" },
  en_chargement: { label: "En chargement", tone: "orange" },
  charge: { label: "Chargé", tone: "violet" },
  en_transit: { label: "En transit", tone: "blue" },
  livre: { label: "Livré", tone: "green" },
};

export const INCIDENT_TYPES: Record<IncidentType, string> = {
  panne: "Panne mécanique",
  accident: "Accident",
  retard: "Retard",
  administratif: "Problème administratif",
  chargement: "Problème de chargement",
  autre: "Autre",
};

export const SEVERITY: Record<Severity, Meta> = {
  faible: { label: "Faible", tone: "neutral" },
  moyenne: { label: "Moyenne", tone: "blue" },
  elevee: { label: "Élevée", tone: "orange" },
  critique: { label: "Critique", tone: "red" },
};

export const INCIDENT_STATUS: Record<IncidentStatus, Meta> = {
  nouveau: { label: "Nouveau", tone: "red" },
  en_cours: { label: "En cours de traitement", tone: "orange" },
  resolu: { label: "Résolu", tone: "green" },
};

export const NOTIFICATION_KINDS: Record<NotificationKind, Meta> = {
  mission: { label: "Mission", tone: "blue" },
  incident: { label: "Incident", tone: "red" },
  retard: { label: "Retard", tone: "orange" },
  flotte: { label: "Flotte", tone: "navy" },
  systeme: { label: "Système", tone: "neutral" },
  document: { label: "Document", tone: "violet" },
  transport: { label: "Transport", tone: "navy" },
  facture: { label: "Facture", tone: "green" },
};

// ── Factures et paiements ────────────────────────────────────
export const INVOICE_FLOWS: Record<"client" | "transporteur" | "debours", { label: string; short: string; hint: string }> = {
  client: { label: "Facture client", short: "À encaisser", hint: "Prestation facturée au client" },
  transporteur: { label: "Facture transporteur", short: "À payer", hint: "Mission facturée par le transporteur partenaire" },
  debours: { label: "Débours", short: "À refacturer", hint: "Frais avancés pour le client (droits, port, magasinage…)" },
};

export const INVOICE_STATUS: Record<"brouillon" | "emise" | "envoyee" | "partielle" | "payee" | "contestee" | "annulee" | "en_retard", Meta> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  emise: { label: "Émise", tone: "violet" },
  envoyee: { label: "Envoyée", tone: "blue" },
  partielle: { label: "Partiellement payée", tone: "orange" },
  payee: { label: "Payée", tone: "green" },
  contestee: { label: "Contestée", tone: "red" },
  annulee: { label: "Annulée", tone: "neutral" },
  en_retard: { label: "En retard", tone: "red" },
};

export const PAYMENT_MODES: Record<"virement" | "especes" | "cheque" | "mobile_money", string> = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  mobile_money: "Mobile money",
};

export const CURRENCIES = ["DJF", "USD", "ETB", "EUR"] as const;

/** Objets de débours courants (liste indicative). */
export const DEBOURS_LABELS = ["Droits et taxes", "Frais portuaires et manutention", "Magasinage", "Surestaries conteneur", "Frais de scanner", "Autre débours"];

// ── Demandes de transport ────────────────────────────────────
export const RESPONSE_STATUS: Record<"envoyee" | "vue" | "acceptee" | "refusee", Meta> = {
  envoyee: { label: "Envoyée", tone: "neutral" },
  vue: { label: "Vue", tone: "blue" },
  acceptee: { label: "Acceptée", tone: "green" },
  refusee: { label: "Refusée", tone: "red" },
};

export const REQUEST_STATUS: Record<"ouverte" | "confirmee" | "annulee" | "expiree", Meta> = {
  ouverte: { label: "En attente de réponses", tone: "orange" },
  confirmee: { label: "Transporteur confirmé", tone: "green" },
  annulee: { label: "Annulée", tone: "neutral" },
  expiree: { label: "Expirée", tone: "red" },
};

// ── Documents de transit ─────────────────────────────────────
// Catalogue indicatif, à valider avec le transitaire pilote.
export const DOC_CATEGORIES: Record<DocCategory, string> = {
  commercial: "Commerciales",
  maritime: "Transport maritime",
  douane: "Douane et port",
  certificat: "Certificats et autorisations",
  transport: "Transport routier",
  livraison: "Livraison",
};

export interface DocTypeMeta {
  label: string;
  short: string;
  category: DocCategory;
  responsible: DocParty;
  /** Étape bloquée tant que la pièce n'est pas vérifiée (null = non bloquante). */
  blocksStep: OperationStep | null;
}

export const DOC_TYPES: Record<DocType, DocTypeMeta> = {
  facture_commerciale: { label: "Facture commerciale", short: "Facture com.", category: "commercial", responsible: "client", blocksStep: null },
  liste_colisage: { label: "Liste de colisage", short: "Colisage", category: "commercial", responsible: "client", blocksStep: null },
  connaissement: { label: "Connaissement (B/L)", short: "B/L", category: "maritime", responsible: "client", blocksStep: null },
  delivery_order: { label: "Bon de livraison compagnie (DO)", short: "DO", category: "maritime", responsible: "transitaire", blocksStep: null },
  declaration_douane: { label: "Déclaration en douane", short: "Déclaration", category: "douane", responsible: "transitaire", blocksStep: null },
  bon_a_enlever: { label: "Bon à enlever", short: "BAE", category: "douane", responsible: "transitaire", blocksStep: 2 },
  bon_sortie_port: { label: "Bon de sortie port", short: "Sortie port", category: "douane", responsible: "transitaire", blocksStep: 4 },
  doc_transit_ethiopie: { label: "Document de transit vers l'Éthiopie", short: "Transit ET", category: "douane", responsible: "transitaire", blocksStep: 4 },
  certificat_origine: { label: "Certificat d'origine", short: "Origine", category: "certificat", responsible: "client", blocksStep: null },
  autorisation_md: { label: "Autorisation marchandise dangereuse", short: "Autor. MD", category: "certificat", responsible: "client", blocksStep: 2 },
  ordre_mission: { label: "Ordre de mission", short: "Ordre", category: "transport", responsible: "transitaire", blocksStep: 2 },
  interchange_eir: { label: "Interchange conteneur (EIR)", short: "EIR", category: "transport", responsible: "transporteur", blocksStep: null },
  pod: { label: "Preuve de livraison signée (POD)", short: "POD", category: "livraison", responsible: "chauffeur", blocksStep: 7 },
};

export const DOC_STATUS: Record<DocStatus, Meta> = {
  attendu: { label: "Attendue", tone: "neutral" },
  recu: { label: "Reçue", tone: "blue" },
  verifie: { label: "Vérifiée", tone: "violet" },
  valide: { label: "Validée", tone: "green" },
  a_corriger: { label: "À corriger", tone: "red" },
};

export const DOC_PARTIES: Record<DocParty, string> = {
  client: "Client",
  transitaire: "Transitaire",
  transporteur: "Transporteur",
  chauffeur: "Chauffeur",
};

/** Statuts qui permettent de franchir une étape bloquée. */
export const DOC_CLEARED: DocStatus[] = ["verifie", "valide"];

export const LICENSE_CATEGORIES = ["C", "CE", "C1E", "D"];
