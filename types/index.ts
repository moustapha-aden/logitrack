// ─────────────────────────────────────────────────────────────
// LogiTrack — modèles de données du prototype
// ─────────────────────────────────────────────────────────────

export type CompanyType = "transport" | "transit" | "logistique" | "client";
export type ActiveStatus = "actif" | "inactif";

export interface Company {
  id: string;
  name: string;
  initials: string;
  color: string; // couleur du monogramme (logo)
  type: CompanyType;
  manager: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  nif: string; // numéro d'identification fiscale fictif
  status: ActiveStatus;
  createdAt: string; // ISO
  /** Présentée dans l'annuaire public (/marketing) avec l'accord de l'entreprise. */
  listed?: boolean;
}

export type CarrierStatus = "actif" | "inactif" | "suspendu";

export interface Carrier {
  id: string;
  name: string;
  manager: string;
  phone: string;
  email: string;
  companyId: string; // entreprise donneuse d'ordre
  status: CarrierStatus;
  fleetSize: number;
  city: string;
}

export type TruckType =
  | "plateau"
  | "citerne"
  | "porte_conteneur"
  | "frigorifique"
  | "semi_remorque";

export type TruckStatus = "disponible" | "en_mission" | "maintenance" | "immobilise";

export interface Truck {
  id: string;
  plate: string;
  brand: string;
  model: string;
  type: TruckType;
  capacityT: number;
  year: number;
  companyId: string;
  driverId: string | null;
  status: TruckStatus;
  image: string;
  mileageKm: number;
  lastService: string; // ISO
  insuranceUntil: string; // ISO
  /** Publié sur la vitrine publique (/marketing) avec l'accord de l'entreprise. */
  published?: boolean;
}

export type DriverAvailability = "disponible" | "en_mission" | "repos" | "conge";

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  companyId: string;
  truckId: string | null;
  availability: DriverAvailability;
  experienceYears: number;
  rating: number; // /5
  avatarColor: string;
  joinedAt: string;
  /** Profil publié dans l'annuaire public (prénom, initiale, expérience — jamais le téléphone). */
  published?: boolean;
}

/** Étapes du suivi des opérations (index 0 → 7). */
export type OperationStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StepEvent {
  step: OperationStep;
  at: string; // ISO
  by: string;
  note?: string;
}

export type MissionStatus = "planifiee" | "en_cours" | "en_retard" | "terminee";

export type GoodsType =
  | "conteneurs"
  | "hydrocarbures"
  | "vrac"
  | "denrees"
  | "materiaux"
  | "equipements"
  | "frigorifique";

export interface Mission {
  id: string;
  ref: string;
  companyId: string;
  clientId: string;
  truckId: string | null;
  driverId: string | null;
  carrierId: string | null;
  origin: string; // id de lieu (lib/data/geo)
  destination: string;
  goodsType: GoodsType;
  description: string;
  plannedDeparture: string; // ISO
  plannedArrival: string; // ISO
  step: OperationStep;
  delayed: boolean;
  priceDjf: number;
  history: StepEvent[];
  createdAt: string;
  /** Camion et chauffeur fournis par un transporteur partenaire (au lieu de la flotte propre). */
  carrierAssignment?: CarrierAssignment | null;
  /** Partage avec le client : lien de suivi et notifications. */
  clientShare?: ClientShare | null;
}

// ── Factures et paiements (suivi, sans manipulation de fonds) ─
/** client = à encaisser ; transporteur = à payer ; debours = frais avancés pour le client, à refacturer. */
export type InvoiceFlow = "client" | "transporteur" | "debours";
/** « En retard » n'est pas stocké : il est calculé à partir de l'échéance. */
export type InvoiceStatus = "brouillon" | "emise" | "envoyee" | "partielle" | "payee" | "contestee" | "annulee";
export type Currency = "DJF" | "USD" | "ETB" | "EUR";
export type PaymentMode = "virement" | "especes" | "cheque" | "mobile_money";

export interface Payment {
  id: string;
  at: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  by: string;
}

export interface Invoice {
  id: string;
  ref: string; // n° de facture ou de reçu
  missionId: string;
  flow: InvoiceFlow;
  label: string; // objet : prestation, droits et taxes, magasinage…
  /** Entreprise cliente (flux client), transporteur (flux transporteur) ou fournisseur payé (débours). */
  counterpartyId: string | null;
  counterpartyName: string;
  amount: number;
  currency: Currency;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  payments: Payment[];
  attachment?: { fileName: string; sizeKb: number; at: string };
  /** Débours : refacturé au client (n° de la facture client concernée). */
  rebilledOn?: string | null;
  note?: string; // motif de contestation ou d'annulation
  createdAt: string;
  updatedAt: string;
}

// ── Partage avec le client ───────────────────────────────────
export interface ClientEmail {
  at: string;
  step: OperationStep;
  to: string;
}

export interface ClientShare {
  token: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  /** Réglages de visibilité choisis par le transitaire. */
  showPlate: boolean;
  showDriver: boolean;
  /** Message rédigé pour le client (incident, retard, information). */
  publicNote?: string;
  publicNoteAt?: string;
  notifyEmail: string;
  notifySteps: OperationStep[];
  sentEmails: ClientEmail[];
}

// ── Coordination transitaire ↔ transporteur ──────────────────
export interface CarrierAssignment {
  plate: string;
  driverName: string;
  driverPhone: string;
}

/** ouverte → confirmée ; ou annulée. L'expiration est calculée à partir de la date limite. */
export type RequestStatus = "ouverte" | "confirmee" | "annulee";
export type ResponseStatus = "envoyee" | "vue" | "acceptee" | "refusee";

export interface CarrierResponse {
  carrierId: string;
  status: ResponseStatus;
  seenAt?: string;
  answeredAt?: string;
  proposal?: CarrierAssignment;
  reason?: string; // motif de refus
}

export interface TransportRequest {
  id: string;
  ref: string;
  missionId: string;
  companyId: string;
  createdAt: string;
  createdBy: string;
  deadline: string; // date limite de réponse
  instructions?: string;
  status: RequestStatus;
  responses: CarrierResponse[];
  confirmedCarrierId?: string | null;
  closedAt?: string;
}

export type MessageRole = "exploitation" | "transporteur" | "chauffeur";

export interface MissionMessage {
  id: string;
  missionId: string;
  at: string;
  author: string;
  role: MessageRole;
  text: string;
}

export interface Load {
  id: string;
  ref: string;
  missionId: string;
  nature: string;
  weightT: number;
  volumeM3: number;
  packages: number;
  declaredValueDjf: number;
  containerNo?: string;
  hazardous: boolean;
}

export type LoadStatus = "en_attente" | "en_chargement" | "charge" | "en_transit" | "livre";

export type IncidentType =
  | "panne"
  | "accident"
  | "retard"
  | "administratif"
  | "chargement"
  | "autre";

export type Severity = "faible" | "moyenne" | "elevee" | "critique";
export type IncidentStatus = "nouveau" | "en_cours" | "resolu";

export interface Incident {
  id: string;
  ref: string;
  missionId: string;
  type: IncidentType;
  description: string;
  date: string; // ISO
  driverId: string | null;
  severity: Severity;
  status: IncidentStatus;
  location: string;
  delayMinutes?: number;
  reportedBy: string;
}

// ── Documents de transit ─────────────────────────────────────
export type DocCategory = "commercial" | "maritime" | "douane" | "certificat" | "transport" | "livraison";

export type DocType =
  | "facture_commerciale"
  | "liste_colisage"
  | "connaissement"
  | "delivery_order"
  | "declaration_douane"
  | "bon_a_enlever"
  | "bon_sortie_port"
  | "doc_transit_ethiopie"
  | "certificat_origine"
  | "autorisation_md"
  | "ordre_mission"
  | "interchange_eir"
  | "pod";

/** Cycle de vie : attendu → reçu → vérifié → validé ; exception : à corriger. */
export type DocStatus = "attendu" | "recu" | "verifie" | "valide" | "a_corriger";

export type DocParty = "client" | "transitaire" | "transporteur" | "chauffeur";

/** Destinataires avec qui la pièce est partagée (vide = interne). */
export type DocAudience = "transporteur" | "client";

export interface DocVersion {
  at: string; // ISO
  by: string;
  fileName: string;
  sizeKb: number;
}

export interface MissionDocument {
  id: string;
  missionId: string;
  type: DocType;
  status: DocStatus;
  responsible: DocParty;
  /** Étape qui ne peut pas être franchie tant que la pièce n'est pas vérifiée ou validée. */
  blocksStep: OperationStep | null;
  dueAt: string | null; // ISO
  sharedWith: DocAudience[];
  versions: DocVersion[];
  note?: string; // motif de correction ou commentaire
  requestedAt?: string; // dernière relance
  /** Dernier signalement « chauffeur / transporteur bloqué par cette pièce ». */
  blockedNotifiedAt?: string;
  updatedAt: string;
}

export type NotificationKind = "mission" | "incident" | "retard" | "flotte" | "systeme" | "document" | "transport" | "facture";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  at: string;
  read: boolean;
  companyId?: string;
  /** Destinataire transporteur partenaire (espace transporteur). */
  carrierId?: string;
  link?: EntityRef;
}

export type EntityKind = "company" | "carrier" | "truck" | "driver" | "mission" | "load" | "incident";

export interface EntityRef {
  kind: EntityKind;
  id: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  actor: string;
  text: string;
  tone: "info" | "success" | "warning" | "danger";
  companyId?: string;
  link?: EntityRef;
}

export interface Settings {
  userName: string;
  userEmail: string;
  userPhone: string;
  organisation: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  incidentAlerts: boolean;
  delayAlerts: boolean;
  weeklyReport: boolean;
  delayThresholdMin: number;
  compactTables: boolean;
}

// ── Vitrine publique : demandes de transport des visiteurs ───
export type LeadStatus = "nouvelle" | "contactee" | "convertie" | "close";

export interface TransportLead {
  id: string;
  ref: string;
  /** Cible de la demande : un camion, un chauffeur, ou l'entreprise seule. */
  truckId?: string;
  driverId?: string;
  companyId: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  organisation?: string;
  origin: string; // id de lieu
  destination: string;
  date: string; // date souhaitée (ISO)
  goodsType: GoodsType;
  message?: string;
  status: LeadStatus;
  handledBy?: string;
  updatedAt: string;
}

// ── Utilisateurs de l'espace entreprise et audit ─────────────
export type CompanyRole = "admin" | "operateur" | "comptabilite" | "lecture";

export interface CompanyUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: CompanyRole;
  active: boolean;
  twoFactor: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type AuditAction = "connexion" | "statut" | "document" | "facture" | "partage" | "droits" | "export" | "modification";

/** Journal non modifiable : aucune action ne permet d'en supprimer une ligne. */
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  companyId?: string;
  action: AuditAction;
  text: string;
  link?: EntityRef;
}

export interface Prefs {
  companyId: string; // entreprise sélectionnée dans l'espace entreprise
  driverId: string; // chauffeur sélectionné dans l'espace chauffeur
  carrierId: string; // transporteur simulé dans l'espace transporteur
  userId: string; // utilisateur simulé dans l'espace entreprise (détermine le rôle)
}

export interface MonthlyStat {
  month: string; // "2026-01"
  missions: number;
  onTime: number;
  delays: number;
  incidents: number;
  fleetUsage: number; // %
}

export interface AppData {
  version: number;
  companies: Company[];
  carriers: Carrier[];
  trucks: Truck[];
  drivers: Driver[];
  missions: Mission[];
  loads: Load[];
  incidents: Incident[];
  documents: MissionDocument[];
  requests: TransportRequest[];
  messages: MissionMessage[];
  invoices: Invoice[];
  users: CompanyUser[];
  audit: AuditEntry[];
  leads: TransportLead[];
  notifications: AppNotification[];
  activity: ActivityItem[];
  monthly: MonthlyStat[];
  settings: Settings;
  prefs: Prefs;
}
