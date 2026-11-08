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

export type NotificationKind = "mission" | "incident" | "retard" | "flotte" | "systeme";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  at: string;
  read: boolean;
  companyId?: string;
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

export interface Prefs {
  companyId: string; // entreprise sélectionnée dans l'espace entreprise
  driverId: string; // chauffeur sélectionné dans l'espace chauffeur
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
  notifications: AppNotification[];
  activity: ActivityItem[];
  monthly: MonthlyStat[];
  settings: Settings;
  prefs: Prefs;
}
