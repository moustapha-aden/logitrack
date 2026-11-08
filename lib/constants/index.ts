import type {
  CarrierStatus,
  CompanyType,
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
};

export const LICENSE_CATEGORIES = ["C", "CE", "C1E", "D"];
