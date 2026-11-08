// ─────────────────────────────────────────────────────────────
// Données de démonstration — entièrement fictives.
// Toute ressemblance avec des entreprises ou personnes existantes
// serait fortuite.
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW, OPERATION_STEPS } from "@/lib/constants";
import type {
  ActivityItem,
  AppData,
  AppNotification,
  Carrier,
  Company,
  Driver,
  GoodsType,
  Incident,
  Load,
  Mission,
  MonthlyStat,
  OperationStep,
  StepEvent,
  Truck,
  TruckType,
} from "@/types";

export const DATA_VERSION = 5;

const NOW = new Date(DEMO_NOW).getTime();
const H = 3600 * 1000;
const iso = (s: string) => new Date(s).toISOString();

// ── Entreprises ──────────────────────────────────────────────
export const companies: Company[] = [
  { id: "cmp-hfl", name: "Horn Freight Logistics", initials: "HF", color: "#2563EB", type: "transport", manager: "Fatouma Omar Daher", phone: "+253 77 21 45 10", email: "contact@hornfreight.dj", address: "Zone franche, Lot 14", city: "Djibouti", nif: "DJ-NIF-200451", status: "actif", createdAt: iso("2024-03-12T09:00:00+03:00") },
  { id: "cmp-rsh", name: "Red Sea Haulage", initials: "RS", color: "#0F9F83", type: "transport", manager: "Mohamed Houssein Waberi", phone: "+253 77 34 88 02", email: "operations@redseahaulage.dj", address: "Route de Venise, Boulaos", city: "Djibouti", nif: "DJ-NIF-200877", status: "actif", createdAt: iso("2024-05-02T09:00:00+03:00") },
  { id: "cmp-tcs", name: "Tadjourah Cargo Services", initials: "TC", color: "#F59E0B", type: "transport", manager: "Kadra Moussa Ibrahim", phone: "+253 77 58 19 63", email: "info@tadjourahcargo.dj", address: "Avenue Nasser, Quartier 7", city: "Djibouti", nif: "DJ-NIF-201034", status: "actif", createdAt: iso("2024-09-18T09:00:00+03:00") },
  { id: "cmp-bts", name: "Baraka Transit & Shipping", initials: "BT", color: "#7C3AED", type: "transit", manager: "Omar Abdillahi Robleh", phone: "+253 77 40 72 31", email: "transit@barakashipping.dj", address: "Boulevard de la République", city: "Djibouti", nif: "DJ-NIF-199823", status: "actif", createdAt: iso("2024-01-08T09:00:00+03:00") },
  { id: "cmp-dle", name: "Doraleh Logistique Express", initials: "DL", color: "#101E35", type: "logistique", manager: "Aïcha Said Bouh", phone: "+253 77 66 03 47", email: "contact@dle-logistique.dj", address: "Zone logistique PK12, Entrepôt B3", city: "Djibouti", nif: "DJ-NIF-201562", status: "actif", createdAt: iso("2025-02-14T09:00:00+03:00") },
  { id: "cmp-hts", name: "Hawd Transport SARL", initials: "HT", color: "#DC2626", type: "transport", manager: "Ismaël Guedi Hared", phone: "+253 77 12 90 58", email: "direction@hawdtransport.dj", address: "Route d'Arta, PK9", city: "Djibouti", nif: "DJ-NIF-201988", status: "actif", createdAt: iso("2025-06-03T09:00:00+03:00") },
  { id: "cmp-gaf", name: "Gulf of Aden Forwarding", initials: "GA", color: "#64748B", type: "transit", manager: "Abdoulkader Farah Elmi", phone: "+253 77 81 26 74", email: "contact@gaforwarding.dj", address: "Rue de Marseille, Plateau du Serpent", city: "Djibouti", nif: "DJ-NIF-198745", status: "inactif", createdAt: iso("2023-11-20T09:00:00+03:00") },
  { id: "cmp-mae", name: "Minoterie de l'Afrique de l'Est", initials: "ME", color: "#B45309", type: "client", manager: "Hassan Ali Youssouf", phone: "+253 21 35 60 11", email: "achats@minoterie-ae.dj", address: "Zone industrielle de Damerjog", city: "Damerjog", nif: "DJ-NIF-197650", status: "actif", createdAt: iso("2024-02-01T09:00:00+03:00") },
  { id: "cmp-eda", name: "Ethio-Djib Agro Import", initials: "EA", color: "#15803D", type: "client", manager: "Hodan Abdi Nour", phone: "+253 21 34 12 89", email: "logistique@ethiodjib-agro.com", address: "Zone franche, Hangar 22", city: "Djibouti", nif: "DJ-NIF-200120", status: "actif", createdAt: iso("2024-04-11T09:00:00+03:00") },
  { id: "cmp-bdm", name: "Bâtir Djibouti Matériaux", initials: "BM", color: "#0E7490", type: "client", manager: "Daher Mohamed Kamil", phone: "+253 21 32 45 77", email: "commandes@batir-dj.com", address: "Route de l'aéroport, Haramous", city: "Djibouti", nif: "DJ-NIF-199410", status: "actif", createdAt: iso("2024-07-23T09:00:00+03:00") },
  { id: "cmp-ecd", name: "Énergie Corne Distribution", initials: "EC", color: "#EA580C", type: "client", manager: "Samira Hassan Aden", phone: "+253 21 35 98 20", email: "supply@energie-corne.dj", address: "Terminal pétrolier de Doraleh", city: "Doraleh", nif: "DJ-NIF-198990", status: "actif", createdAt: iso("2024-03-30T09:00:00+03:00") },
  { id: "cmp-fmc", name: "Fraîcheur Marché Central", initials: "FM", color: "#0891B2", type: "client", manager: "Roukia Elmi Abdo", phone: "+253 21 33 70 45", email: "appro@fraicheur-mc.dj", address: "Marché central, Rue d'Éthiopie", city: "Djibouti", nif: "DJ-NIF-201311", status: "actif", createdAt: iso("2025-01-15T09:00:00+03:00") },
];

// ── Transporteurs (sous-traitants autorisés) ─────────────────
export const carriers: Carrier[] = [
  { id: "car-01", name: "Ayaan Transport Express", manager: "Abdirahman Ayaan Ali", phone: "+253 77 05 44 18", email: "ayaan.express@mail.dj", companyId: "cmp-hfl", status: "actif", fleetSize: 6, city: "Djibouti" },
  { id: "car-02", name: "Barwaqo Trucking", manager: "Mouna Barwaqo Hassan", phone: "+253 77 19 62 07", email: "barwaqo.trucking@mail.dj", companyId: "cmp-hfl", status: "actif", fleetSize: 4, city: "Ali Sabieh" },
  { id: "car-03", name: "Ghoubet Routiers Associés", manager: "Elmi Djama Waiss", phone: "+253 77 27 83 50", email: "ghoubet.routiers@mail.dj", companyId: "cmp-rsh", status: "actif", fleetSize: 9, city: "Arta" },
  { id: "car-04", name: "Lac Assal Fret", manager: "Kadar Hassan Mohamed", phone: "+253 77 33 10 92", email: "assal.fret@mail.dj", companyId: "cmp-tcs", status: "actif", fleetSize: 3, city: "Tadjourah" },
  { id: "car-05", name: "Goda Fret Partenaires", manager: "Zahra Omar Ibrahim", phone: "+253 77 48 25 66", email: "goda.fret@mail.dj", companyId: "cmp-bts", status: "actif", fleetSize: 7, city: "Djibouti" },
  { id: "car-06", name: "Moucha Transport Services", manager: "Idriss Ali Bourhan", phone: "+253 77 52 71 39", email: "moucha.ts@mail.dj", companyId: "cmp-dle", status: "inactif", fleetSize: 2, city: "Djibouti" },
  { id: "car-07", name: "Arrei Transports", manager: "Houmed Saleh Ahmed", phone: "+253 77 61 08 84", email: "arrei.transports@mail.dj", companyId: "cmp-hts", status: "actif", fleetSize: 5, city: "Dikhil" },
  { id: "car-08", name: "Obock Cargo Routier", manager: "Youssouf Daoud Ali", phone: "+253 77 74 36 21", email: "obock.cargo@mail.dj", companyId: "cmp-rsh", status: "suspendu", fleetSize: 3, city: "Obock" },
];

// ── Camions ──────────────────────────────────────────────────
type TruckSeed = [id: string, plate: string, brand: string, model: string, type: TruckType, capacityT: number, year: number, companyId: string, driverId: string | null, base: Truck["status"], image: string, km: number];
const truckSeeds: TruckSeed[] = [
  ["t01", "DJ-482-KT", "Sinotruk", "HOWO 371", "semi_remorque", 40, 2022, "cmp-hfl", "d01", "disponible", "truck-howo-semi-bachee.jpg", 182400],
  ["t02", "DJ-517-HF", "Volvo", "FM 460", "porte_conteneur", 32, 2021, "cmp-hfl", "d02", "disponible", "truck-container-1.jpg", 241900],
  ["t03", "DJ-593-HF", "Mercedes-Benz", "Axor 2643", "semi_remorque", 40, 2023, "cmp-hfl", "d03", "disponible", "truck-axor-conteneur.jpg", 98700],
  ["t04", "DJ-604-HF", "Sinotruk", "HOWO 336 citerne", "citerne", 30, 2020, "cmp-hfl", "d04", "disponible", "truck-howo-citerne.jpg", 312500],
  ["t05", "DJ-622-HF", "Scania", "R 450", "porte_conteneur", 32, 2022, "cmp-hfl", "d05", "disponible", "truck-conteneur-plateau-corridor.jpg", 167300],
  ["t06", "DJ-655-HF", "Mercedes-Benz", "Actros 2641 grue", "plateau", 25, 2019, "cmp-hfl", null, "maintenance", "truck-flatbed-2.jpg", 401200],
  ["t07", "DJ-701-RS", "Volvo", "FH 460", "semi_remorque", 38, 2021, "cmp-rsh", "d06", "disponible", "truck-semi-3.jpg", 205600],
  ["t08", "DJ-718-RS", "Iveco", "Trakker 380 citerne", "citerne", 30, 2022, "cmp-rsh", "d07", "disponible", "truck-iveco-citerne.jpg", 158900],
  ["t09", "DJ-736-RS", "Mercedes-Benz", "Actros 2545 grue", "plateau", 22, 2023, "cmp-rsh", "d08", "disponible", "truck-flatbed-1.jpg", 76400],
  ["t10", "DJ-749-RS", "Iveco", "S-Way 480", "porte_conteneur", 32, 2022, "cmp-rsh", "d09", "disponible", "truck-conteneur-plateau-corridor.jpg", 189200],
  ["t11", "DJ-763-RS", "DAF", "XF 480", "semi_remorque", 40, 2018, "cmp-rsh", null, "immobilise", "truck-semi-bachee-corridor.jpg", 498700],
  ["t12", "DJ-805-TC", "Isuzu", "FVR frigorifique", "frigorifique", 9, 2021, "cmp-tcs", "d10", "disponible", "truck-reefer-1.jpg", 132800],
  ["t13", "DJ-812-TC", "Sinotruk", "HOWO 375", "semi_remorque", 38, 2020, "cmp-tcs", "d11", "disponible", "truck-semi-benne-corridor.jpg", 276100],
  ["t14", "DJ-827-TC", "Mercedes-Benz", "Actros 3341", "plateau", 25, 2019, "cmp-tcs", "d12", "disponible", "truck-flatbed-2.jpg", 334900],
  ["t15", "DJ-904-BT", "Volvo", "FM 420", "porte_conteneur", 32, 2021, "cmp-bts", "d13", "disponible", "truck-container-1.jpg", 219400],
  ["t16", "DJ-918-BT", "FAW", "J6P 420", "semi_remorque", 36, 2020, "cmp-bts", "d14", "disponible", "truck-faw-conteneur.jpg", 288300],
  ["t17", "DJ-931-BT", "Isuzu", "FVZ frigorifique", "frigorifique", 14, 2023, "cmp-bts", "d15", "disponible", "truck-reefer-1.jpg", 64200],
  ["t18", "DJ-302-DL", "Mercedes-Benz", "Actros 1845 frigo", "frigorifique", 22, 2022, "cmp-dle", "d16", "disponible", "truck-reefer-2.jpg", 143700],
  ["t19", "DJ-316-DL", "Volvo", "FH 540", "semi_remorque", 40, 2024, "cmp-dle", "d17", "disponible", "truck-semi-3.jpg", 41800],
  ["t20", "DJ-329-DL", "Sinotruk", "HOWO 371 citerne", "citerne", 32, 2021, "cmp-dle", "d18", "disponible", "truck-howo-citerne.jpg", 197500],
  ["t21", "DJ-341-DL", "Mercedes-Benz", "Actros 3336 plateau", "plateau", 26, 2022, "cmp-dle", null, "disponible", "truck-flatbed-1.jpg", 121600],
  ["t22", "DJ-402-HT", "Mercedes-Benz", "Axor 1843", "semi_remorque", 40, 2023, "cmp-hts", "d19", "disponible", "truck-axor-conteneur.jpg", 88900],
  ["t23", "DJ-415-HT", "DAF", "CF 450", "porte_conteneur", 30, 2020, "cmp-hts", "d20", "disponible", "truck-container-1.jpg", 263400],
  ["t24", "DJ-428-HT", "Iveco", "Trakker 410 citerne", "citerne", 28, 2019, "cmp-hts", null, "maintenance", "truck-iveco-citerne.jpg", 356200],
];

const trucksBase: Truck[] = truckSeeds.map(([id, plate, brand, model, type, capacityT, year, companyId, driverId, status, image, km], i) => ({
  id,
  plate,
  brand,
  model,
  type,
  capacityT,
  year,
  companyId,
  driverId,
  status,
  image: `/images/${image}`,
  mileageKm: km,
  lastService: new Date(NOW - (12 + ((i * 7) % 60)) * 24 * H).toISOString(),
  insuranceUntil: new Date(NOW + (40 + ((i * 23) % 300)) * 24 * H).toISOString(),
}));

// ── Chauffeurs ───────────────────────────────────────────────
type DriverSeed = [id: string, first: string, last: string, companyId: string, truckId: string | null, base: Driver["availability"], cat: string, exp: number, rating: number];
const AVATAR_COLORS = ["#2563EB", "#0F9F83", "#7C3AED", "#EA580C", "#0E7490", "#B45309", "#DB2777", "#101E35"];
const driverSeeds: DriverSeed[] = [
  ["d01", "Ahmed", "Ali Hassan", "cmp-hfl", "t01", "disponible", "CE", 12, 4.8],
  ["d02", "Omar", "Farah Djama", "cmp-hfl", "t02", "disponible", "CE", 9, 4.6],
  ["d03", "Ismaël", "Robleh Guedi", "cmp-hfl", "t03", "disponible", "CE", 6, 4.5],
  ["d04", "Hassan", "Youssouf Abdi", "cmp-hfl", "t04", "disponible", "CE", 15, 4.9],
  ["d05", "Mahamoud", "Aden Bouh", "cmp-hfl", "t05", "disponible", "CE", 8, 4.3],
  ["d06", "Abdourahman", "Elmi Waiss", "cmp-rsh", "t07", "disponible", "CE", 11, 4.7],
  ["d07", "Idriss", "Goumaneh Said", "cmp-rsh", "t08", "disponible", "CE", 7, 4.4],
  ["d08", "Saleh", "Barkat Ali", "cmp-rsh", "t09", "disponible", "C", 5, 4.2],
  ["d09", "Moussa", "Djama Houmed", "cmp-rsh", "t10", "disponible", "CE", 10, 4.6],
  ["d10", "Houssein", "Ibrahim Dirieh", "cmp-tcs", "t12", "disponible", "C", 4, 4.5],
  ["d11", "Daoud", "Ahmed Kamil", "cmp-tcs", "t13", "repos", "CE", 13, 4.7],
  ["d12", "Yacin", "Omar Robleh", "cmp-tcs", "t14", "disponible", "CE", 6, 4.1],
  ["d13", "Ali", "Mohamed Hared", "cmp-bts", "t15", "disponible", "CE", 9, 4.6],
  ["d14", "Abdi", "Nour Aden", "cmp-bts", "t16", "repos", "CE", 14, 4.8],
  ["d15", "Hodan", "Moussa Ibrahim", "cmp-bts", "t17", "disponible", "C1E", 5, 4.9],
  ["d16", "Fathi", "Ismaël Bourhan", "cmp-dle", "t18", "disponible", "CE", 8, 4.4],
  ["d17", "Ibrahim", "Kayad Osman", "cmp-dle", "t19", "disponible", "CE", 10, 4.7],
  ["d18", "Bouh", "Abdillahi Farah", "cmp-dle", "t20", "disponible", "CE", 16, 4.8],
  ["d19", "Kamil", "Hassan Djibril", "cmp-hts", "t22", "disponible", "CE", 7, 4.3],
  ["d20", "Said", "Ahmed Mohamed", "cmp-hts", "t23", "disponible", "CE", 11, 4.5],
  ["d21", "Abdoulkader", "Hassan Ladieh", "cmp-hfl", null, "disponible", "CE", 3, 4.0],
  ["d22", "Nasra", "Ali Bouh", "cmp-dle", null, "conge", "C", 6, 4.6],
];

const driversBase: Driver[] = driverSeeds.map(([id, firstName, lastName, companyId, truckId, availability, cat, exp, rating], i) => ({
  id,
  firstName,
  lastName,
  phone: `+253 77 ${String(10 + ((i * 17) % 89)).padStart(2, "0")} ${String(10 + ((i * 31) % 89)).padStart(2, "0")} ${String(10 + ((i * 43) % 89)).padStart(2, "0")}`,
  licenseNumber: `PC-DJ-${String(410230 + i * 1373)}`,
  licenseCategory: cat,
  licenseExpiry: new Date(NOW + (120 + ((i * 97) % 900)) * 24 * H).toISOString(),
  companyId,
  truckId,
  availability,
  experienceYears: exp,
  rating,
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  joinedAt: new Date(NOW - (200 + ((i * 61) % 1100)) * 24 * H).toISOString(),
}));

// ── Missions ─────────────────────────────────────────────────
type MissionSeed = [n: number, companyId: string, clientId: string, truckId: string | null, driverId: string | null, carrierId: string | null, origin: string, destination: string, goods: GoodsType, description: string, departure: string, step: OperationStep, delayed: boolean, price: number];
const missionSeeds: MissionSeed[] = [
  [1, "cmp-hfl", "cmp-mae", "t01", "d01", "car-01", "port-djibouti", "dire-dawa", "vrac", "Blé tendre en vrac — 38 t, bennes bâchées", "2026-10-20T06:00:00+03:00", 7, false, 1450000],
  [2, "cmp-rsh", "cmp-ecd", "t08", "d07", null, "doraleh", "galafi", "hydrocarbures", "Gasoil — 30 000 L, citerne compartimentée", "2026-10-22T05:30:00+03:00", 7, false, 1180000],
  [3, "cmp-tcs", "cmp-fmc", "t12", "d10", null, "pk12", "djibouti-ville", "frigorifique", "Produits laitiers réfrigérés — 420 colis à +4 °C", "2026-10-24T07:00:00+03:00", 7, false, 180000],
  [4, "cmp-bts", "cmp-eda", "t15", "d13", "car-05", "doraleh", "dire-dawa", "conteneurs", "1 × 40' engrais NPK en sacs de 50 kg", "2026-10-25T06:00:00+03:00", 7, false, 1350000],
  [5, "cmp-dle", "cmp-bdm", "t19", "d17", null, "port-djibouti", "ali-sabieh", "materiaux", "Ciment Portland — 1 600 sacs de 25 kg", "2026-10-27T07:30:00+03:00", 7, false, 420000],
  [6, "cmp-hts", "cmp-mae", "t22", "d19", "car-07", "port-djibouti", "dikhil", "denrees", "Riz et sucre — 900 sacs de 50 kg", "2026-10-28T06:30:00+03:00", 7, false, 520000],
  [7, "cmp-hfl", "cmp-bdm", "t03", "d03", null, "doraleh", "damerjog", "equipements", "Groupe électrogène 500 kVA sur palette", "2026-10-30T08:00:00+03:00", 7, false, 210000],
  [8, "cmp-rsh", "cmp-eda", "t10", "d09", "car-03", "doraleh", "galafi", "conteneurs", "2 × 20' pièces détachées agricoles", "2026-11-01T05:00:00+03:00", 7, false, 1220000],
  [9, "cmp-dle", "cmp-fmc", "t18", "d16", null, "port-djibouti", "tadjourah", "frigorifique", "Fruits et légumes frais — 18 palettes", "2026-11-02T06:00:00+03:00", 7, false, 460000],
  [10, "cmp-hfl", "cmp-ecd", "t04", "d04", null, "doraleh", "ali-sabieh", "hydrocarbures", "Essence sans plomb — 32 000 L", "2026-11-06T06:00:00+03:00", 6, false, 480000],
  [11, "cmp-tcs", "cmp-mae", "t13", "d11", "car-04", "port-djibouti", "dire-dawa", "vrac", "Farine de blé — 36 t en sacs", "2026-11-05T05:00:00+03:00", 6, false, 1400000],
  [12, "cmp-bts", "cmp-bdm", "t16", "d14", null, "port-djibouti", "pk12", "materiaux", "Fers à béton HA12 — 34 t", "2026-11-07T08:00:00+03:00", 6, false, 150000],
  [13, "cmp-hfl", "cmp-eda", "t02", "d02", "car-02", "doraleh", "galafi", "conteneurs", "1 × 40' matériel agricole (motoculteurs)", "2026-11-08T05:00:00+03:00", 4, false, 1250000],
  [14, "cmp-hfl", "cmp-mae", "t05", "d05", null, "port-djibouti", "dire-dawa", "conteneurs", "2 × 20' huile alimentaire en bidons", "2026-11-07T22:00:00+03:00", 4, true, 1480000],
  [15, "cmp-rsh", "cmp-ecd", "t07", "d06", null, "doraleh", "dikhil", "equipements", "Transformateurs électriques 630 kVA — 3 unités", "2026-11-08T06:30:00+03:00", 4, false, 560000],
  [16, "cmp-rsh", "cmp-bdm", "t09", "d08", null, "port-djibouti", "damerjog", "materiaux", "Charpente métallique — 14 éléments", "2026-11-08T07:50:00+03:00", 3, false, 190000],
  [17, "cmp-tcs", "cmp-fmc", "t14", "d12", null, "pk12", "ali-sabieh", "denrees", "Eau minérale — 1 200 packs", "2026-11-08T04:20:00+03:00", 5, true, 380000],
  [18, "cmp-bts", "cmp-eda", "t17", "d15", "car-05", "port-djibouti", "dire-dawa", "frigorifique", "Médicaments sous température dirigée (+2/+8 °C)", "2026-11-08T04:00:00+03:00", 4, true, 1650000],
  [19, "cmp-dle", "cmp-ecd", "t20", "d18", null, "doraleh", "tadjourah", "hydrocarbures", "Gasoil — 32 000 L pour centrale électrique", "2026-11-08T06:00:00+03:00", 4, false, 640000],
  [20, "cmp-hts", "cmp-mae", "t23", "d20", null, "doraleh", "galafi", "conteneurs", "1 × 40' sucre cristallisé", "2026-11-08T03:30:00+03:00", 4, true, 1230000],
  [21, "cmp-dle", "cmp-bdm", "t19", "d17", null, "port-djibouti", "arta", "materiaux", "Carreaux et sanitaires — 22 palettes", "2026-11-08T09:30:00+03:00", 2, false, 260000],
  [22, "cmp-hfl", "cmp-mae", "t01", "d01", null, "port-djibouti", "ali-sabieh", "vrac", "Blé dur en vrac — 36 t", "2026-11-08T13:00:00+03:00", 1, false, 520000],
  [23, "cmp-hfl", "cmp-bdm", "t03", "d03", null, "doraleh", "pk12", "materiaux", "Tôles ondulées galvanisées — 28 t", "2026-11-09T07:00:00+03:00", 0, false, 160000],
  [24, "cmp-rsh", "cmp-ecd", "t08", "d07", null, "doraleh", "dikhil", "hydrocarbures", "Kérosène — 28 000 L", "2026-11-09T05:00:00+03:00", 1, false, 590000],
  [25, "cmp-tcs", "cmp-fmc", "t12", "d10", null, "port-djibouti", "djibouti-ville", "frigorifique", "Volailles congelées — 300 colis à -18 °C", "2026-11-09T06:30:00+03:00", 0, false, 140000],
  [26, "cmp-bts", "cmp-eda", "t15", "d13", null, "doraleh", "dire-dawa", "conteneurs", "1 × 40' pneumatiques poids lourds", "2026-11-10T05:00:00+03:00", 0, false, 1380000],
  [27, "cmp-hts", "cmp-bdm", "t22", "d19", null, "port-djibouti", "damerjog", "equipements", "Pelle hydraulique 20 t sur porte-engin", "2026-11-10T08:00:00+03:00", 0, false, 230000],
  [28, "cmp-dle", "cmp-fmc", "t18", "d16", null, "pk12", "tadjourah", "frigorifique", "Poissons et produits de la mer — 9 t", "2026-11-09T05:30:00+03:00", 1, false, 470000],
  [29, "cmp-hfl", "cmp-ecd", "t04", "d04", null, "doraleh", "galafi", "hydrocarbures", "Gasoil — 30 000 L", "2026-11-11T05:00:00+03:00", 0, false, 1190000],
  [30, "cmp-rsh", "cmp-eda", null, null, "car-03", "port-djibouti", "dire-dawa", "conteneurs", "2 × 20' café vert — chauffeur et camion à affecter", "2026-11-12T05:00:00+03:00", 0, false, 1420000],
];

const TRIP_HOURS: Record<string, number> = {
  pk12: 1, "djibouti-ville": 1, damerjog: 1.5, arta: 2, "ali-sabieh": 3.5, tadjourah: 3.5, dikhil: 4.5, galafi: 7, "dire-dawa": 12, doraleh: 1, "port-djibouti": 1, guelile: 4,
};
export const tripHours = (dest: string) => TRIP_HOURS[dest] ?? 3;

const DELAY_NOTES: Record<number, string> = {
  14: "Attente prolongée au poste frontière de Guelilé",
  18: "Arrêt technique : défaillance du groupe froid",
  20: "Immobilisation temporaire : crevaison essieu arrière",
  17: "Déchargement retardé : quai du client occupé",
};

/** Date de création : 48 h avant le départ, ou plus récente pour les missions planifiées. */
function createdAtFor(n: number, dep: number): number {
  return Math.min(dep - 48 * H, NOW - (20 + (n % 6) * 4) * H);
}

function buildHistory(s: MissionSeed, driverLabel: string, companyShort: string): StepEvent[] {
  const [n, , , , , , , dest, , , departure, step, delayed] = s;
  const dep = new Date(departure).getTime();
  const dur = tripHours(dest) * H + (delayed ? 2 * H : 0);
  const offsets = [-48 * H, -3 * H, 0, 1.5 * H, 2 * H, 2 * H + dur, 3 * H + dur, 7 * H + dur];
  const created = createdAtFor(n, dep);
  const events: StepEvent[] = [];
  for (let st = 0; st <= step; st++) {
    let t = st === 0 ? created : st === 1 && dep - 3 * H > NOW ? created + 3 * H : dep + offsets[st];
    const ceiling = NOW - (step - st) * 12 * 60 * 1000 - 5 * 60 * 1000;
    if (t > ceiling) t = ceiling;
    const meta = OPERATION_STEPS[st];
    events.push({
      step: st as OperationStep,
      at: new Date(t).toISOString(),
      by: meta.actor === "Chauffeur" ? driverLabel : `Exploitation ${companyShort}`,
      note: st === step && delayed ? DELAY_NOTES[n] : undefined,
    });
  }
  return events;
}

const missionsBase: Mission[] = missionSeeds.map((s) => {
  const [n, companyId, clientId, truckId, driverId, carrierId, origin, destination, goodsType, description, departure, step, delayed, priceDjf] = s;
  const d = driversBase.find((x) => x.id === driverId);
  const c = companies.find((x) => x.id === companyId);
  const dep = new Date(departure).getTime();
  return {
    id: `m${String(n).padStart(2, "0")}`,
    ref: `MS-26-${String(1040 + n).padStart(4, "0")}`,
    companyId,
    clientId,
    truckId,
    driverId,
    carrierId,
    origin,
    destination,
    goodsType,
    description,
    plannedDeparture: new Date(dep).toISOString(),
    plannedArrival: new Date(dep + (tripHours(destination) + 1) * H).toISOString(),
    step,
    delayed,
    priceDjf,
    history: buildHistory(s, d ? `${d.firstName} ${d.lastName}` : "Chauffeur", c?.initials ?? ""),
    createdAt: new Date(createdAtFor(n, dep)).toISOString(),
  };
});

// ── Chargements (1 par mission) ──────────────────────────────
const LOAD_PROFILE: Record<GoodsType, { w: number; v: number; p: number; value: number; hazardous: boolean }> = {
  conteneurs: { w: 24, v: 58, p: 2, value: 9800000, hazardous: false },
  hydrocarbures: { w: 26, v: 31, p: 1, value: 7400000, hazardous: true },
  vrac: { w: 36, v: 48, p: 1, value: 5200000, hazardous: false },
  denrees: { w: 22, v: 40, p: 900, value: 4100000, hazardous: false },
  materiaux: { w: 30, v: 26, p: 22, value: 3600000, hazardous: false },
  equipements: { w: 14, v: 36, p: 3, value: 12500000, hazardous: false },
  frigorifique: { w: 8, v: 32, p: 420, value: 3900000, hazardous: false },
};

const num = (s: string) => Number(s.replace(/[\s ]/g, "").replace(",", "."));

/** Chargement cohérent avec la description de la mission (tonnage, litres, conteneurs, colis). */
const loadsBase: Load[] = missionsBase.map((m, i) => {
  const p = LOAD_PROFILE[m.goodsType];
  const jitter = 0.85 + ((i * 37) % 30) / 100;
  const d = m.description;
  const tons = d.match(/(\d+(?:[.,]\d+)?)\s*t\b/);
  const liters = d.match(/(\d{1,3}(?:[\s ]\d{3})+|\d+)\s*L\b/);
  const boxes = d.match(/(\d+)\s*×\s*(20|40)'/);
  const pkgs = d.match(/(\d{1,3}(?:[\s ]\d{3})+|\d+)\s*(sacs|colis|packs|palettes|éléments|unités)/);
  const capacity = trucksBase.find((t) => t.id === m.truckId)?.capacityT;

  let weight = p.w * jitter;
  let volume = p.v * jitter;
  let packages = p.p;
  if (liters) {
    weight = num(liters[1]) * 0.00083; // densité moyenne des carburants
    volume = num(liters[1]) / 1000;
  } else if (tons) {
    weight = num(tons[1]);
    volume = weight * 1.3;
  } else if (boxes) {
    const n = Number(boxes[1]);
    weight = n * (boxes[2] === "40" ? 22 : 12) * jitter;
    volume = n * (boxes[2] === "40" ? 67 : 33);
  }
  if (boxes) packages = Number(boxes[1]);
  else if (pkgs) packages = num(pkgs[1]);
  else if (tons && /sacs/.test(d)) packages = Math.round(weight * 20);
  else if (tons || liters) packages = 1;
  if (capacity) weight = Math.min(weight, capacity * 0.97);

  return {
    id: `ld${m.id.slice(1)}`,
    ref: `CH-26-${String(5200 + i * 7).padStart(4, "0")}`,
    missionId: m.id,
    nature: d.split(" — ")[0],
    weightT: Math.round(weight * 10) / 10,
    volumeM3: Math.round(volume),
    packages: Math.max(1, Math.round(packages)),
    declaredValueDjf: Math.round((p.value * jitter) / 1000) * 1000,
    containerNo: boxes ? `MSKU ${String(4810230 + i * 1907).slice(0, 7)}` : undefined,
    hazardous: p.hazardous,
  };
});

// ── Incidents ────────────────────────────────────────────────
export const incidents: Incident[] = [
  { id: "i01", ref: "INC-26-0312", missionId: "m14", type: "retard", description: "Attente prolongée au poste frontière de Guelilé : contrôle documentaire renforcé sur les déclarations de transit.", date: iso("2026-11-08T07:40:00+03:00"), driverId: "d05", severity: "moyenne", status: "en_cours", location: "Poste frontière de Guelilé", delayMinutes: 150, reportedBy: "Mahamoud Aden Bouh" },
  { id: "i02", ref: "INC-26-0313", missionId: "m18", type: "panne", description: "Défaillance du groupe froid, température de la caisse en hausse (8 °C). Intervention d'un technicien demandée.", date: iso("2026-11-08T08:15:00+03:00"), driverId: "d15", severity: "critique", status: "nouveau", location: "RN5 — km 64, après Ali Sabieh", delayMinutes: 120, reportedBy: "Hodan Moussa Ibrahim" },
  { id: "i03", ref: "INC-26-0311", missionId: "m20", type: "panne", description: "Crevaison d'un pneu sur l'essieu arrière de la remorque, remplacement en cours sur place.", date: iso("2026-11-08T07:05:00+03:00"), driverId: "d20", severity: "elevee", status: "en_cours", location: "RN1 — 15 km avant Dikhil", delayMinutes: 90, reportedBy: "Said Ahmed Mohamed" },
  { id: "i04", ref: "INC-26-0305", missionId: "m11", type: "retard", description: "Congestion à la sortie du port, départ décalé d'une heure.", date: iso("2026-11-05T06:30:00+03:00"), driverId: "d11", severity: "faible", status: "resolu", location: "Port de Djibouti — porte 3", delayMinutes: 60, reportedBy: "Daoud Ahmed Kamil" },
  { id: "i05", ref: "INC-26-0291", missionId: "m04", type: "administratif", description: "Document de transit T1 incomplet, régularisé par le transitaire avant le passage en douane.", date: iso("2026-10-25T09:10:00+03:00"), driverId: "d13", severity: "moyenne", status: "resolu", location: "Terminal de Doraleh", delayMinutes: 75, reportedBy: "Exploitation BT" },
  { id: "i06", ref: "INC-26-0298", missionId: "m08", type: "chargement", description: "Conteneur mal arrimé détecté au contrôle de sortie, ré-arrimage effectué par l'équipe du terminal.", date: iso("2026-11-01T06:00:00+03:00"), driverId: "d09", severity: "elevee", status: "resolu", location: "Terminal de Doraleh", delayMinutes: 40, reportedBy: "Moussa Djama Houmed" },
  { id: "i07", ref: "INC-26-0287", missionId: "m02", type: "panne", description: "Voyant pression d'huile allumé, contrôle et appoint effectués au garage de Dikhil.", date: iso("2026-10-22T10:20:00+03:00"), driverId: "d07", severity: "moyenne", status: "resolu", location: "Dikhil", delayMinutes: 50, reportedBy: "Idriss Goumaneh Said" },
  { id: "i08", ref: "INC-26-0294", missionId: "m06", type: "accident", description: "Accrochage léger avec un véhicule léger au rond-point de PK12. Constat amiable, aucun blessé.", date: iso("2026-10-28T07:15:00+03:00"), driverId: "d19", severity: "elevee", status: "resolu", location: "Rond-point PK12", delayMinutes: 80, reportedBy: "Kamil Hassan Djibril" },
  { id: "i09", ref: "INC-26-0314", missionId: "m17", type: "retard", description: "Déchargement retardé : quai du client occupé par une autre livraison.", date: iso("2026-11-08T10:05:00+03:00"), driverId: "d12", severity: "faible", status: "nouveau", location: "Ali Sabieh — entrepôt client", delayMinutes: 45, reportedBy: "Yacin Omar Robleh" },
  { id: "i10", ref: "INC-26-0310", missionId: "m13", type: "autre", description: "Contrôle de routine sur la RN1 à hauteur d'Arta. Aucune anomalie.", date: iso("2026-11-08T07:20:00+03:00"), driverId: "d02", severity: "faible", status: "resolu", location: "RN1 — Arta", delayMinutes: 15, reportedBy: "Omar Farah Djama" },
  { id: "i11", ref: "INC-26-0308", missionId: "m10", type: "chargement", description: "Écart de 400 L constaté au jaugeage à la livraison, vérification des compteurs en cours.", date: iso("2026-11-06T14:00:00+03:00"), driverId: "d04", severity: "moyenne", status: "en_cours", location: "Ali Sabieh — dépôt carburant", reportedBy: "Hassan Youssouf Abdi" },
  { id: "i12", ref: "INC-26-0301", missionId: "m09", type: "retard", description: "Route côtière ralentie par des travaux de réfection en direction de Tadjourah.", date: iso("2026-11-02T10:00:00+03:00"), driverId: "d16", severity: "faible", status: "resolu", location: "Route de Tadjourah", delayMinutes: 35, reportedBy: "Fathi Ismaël Bourhan" },
];

// ── Notifications & activité ─────────────────────────────────
export const notifications: AppNotification[] = [
  { id: "n01", kind: "incident", title: "Incident critique — MS-26-1058", message: "Défaillance du groupe froid signalée par Hodan Moussa Ibrahim sur la RN5.", at: iso("2026-11-08T08:16:00+03:00"), read: false, companyId: "cmp-bts", link: { kind: "incident", id: "i02" } },
  { id: "n02", kind: "retard", title: "Retard déclaré — MS-26-1054", message: "Attente au poste frontière de Guelilé, retard estimé 2 h 30.", at: iso("2026-11-08T07:41:00+03:00"), read: false, companyId: "cmp-hfl", link: { kind: "mission", id: "m14" } },
  { id: "n03", kind: "incident", title: "Panne — MS-26-1060", message: "Crevaison essieu arrière avant Dikhil, intervention en cours.", at: iso("2026-11-08T07:06:00+03:00"), read: false, companyId: "cmp-hts", link: { kind: "incident", id: "i03" } },
  { id: "n04", kind: "mission", title: "Arrivée à destination — MS-26-1057", message: "Le camion DJ-827-TC est arrivé à Ali Sabieh.", at: iso("2026-11-08T09:50:00+03:00"), read: false, companyId: "cmp-tcs", link: { kind: "mission", id: "m17" } },
  { id: "n05", kind: "mission", title: "Chargement démarré — MS-26-1061", message: "Chargement en cours au Port de Djibouti pour Arta.", at: iso("2026-11-08T09:35:00+03:00"), read: true, companyId: "cmp-dle", link: { kind: "mission", id: "m21" } },
  { id: "n06", kind: "flotte", title: "Maintenance planifiée", message: "Le camion DJ-655-HF est en atelier pour révision des freins.", at: iso("2026-11-07T16:20:00+03:00"), read: true, companyId: "cmp-hfl", link: { kind: "truck", id: "t06" } },
  { id: "n07", kind: "mission", title: "Livraison effectuée — MS-26-1052", message: "Fers à béton livrés à PK12, mission prête à être clôturée.", at: iso("2026-11-07T12:00:00+03:00"), read: true, companyId: "cmp-bts", link: { kind: "mission", id: "m12" } },
  { id: "n08", kind: "systeme", title: "Mission non affectée", message: "La mission MS-26-1070 n'a ni camion ni chauffeur affecté.", at: iso("2026-11-07T14:30:00+03:00"), read: false, companyId: "cmp-rsh", link: { kind: "mission", id: "m30" } },
  { id: "n09", kind: "flotte", title: "Véhicule immobilisé", message: "Le camion DJ-763-RS est immobilisé (boîte de vitesses).", at: iso("2026-11-06T09:30:00+03:00"), read: true, companyId: "cmp-rsh", link: { kind: "truck", id: "t11" } },
  { id: "n10", kind: "systeme", title: "Rapport hebdomadaire disponible", message: "Le rapport d'activité de la semaine 45 est prêt.", at: iso("2026-11-06T07:00:00+03:00"), read: true },
];

export const activity: ActivityItem[] = [
  { id: "a01", at: iso("2026-11-08T10:05:00+03:00"), actor: "Yacin Omar Robleh", text: "a signalé un retard de déchargement à Ali Sabieh (MS-26-1057)", tone: "warning", companyId: "cmp-tcs", link: { kind: "incident", id: "i09" } },
  { id: "a02", at: iso("2026-11-08T09:50:00+03:00"), actor: "Yacin Omar Robleh", text: "est arrivé à destination — MS-26-1057", tone: "success", companyId: "cmp-tcs", link: { kind: "mission", id: "m17" } },
  { id: "a03", at: iso("2026-11-08T09:35:00+03:00"), actor: "Ibrahim Kayad Osman", text: "a démarré le chargement de la mission MS-26-1061", tone: "info", companyId: "cmp-dle", link: { kind: "mission", id: "m21" } },
  { id: "a04", at: iso("2026-11-08T09:20:00+03:00"), actor: "Saleh Barkat Ali", text: "a terminé le chargement — MS-26-1056", tone: "info", companyId: "cmp-rsh", link: { kind: "mission", id: "m16" } },
  { id: "a05", at: iso("2026-11-08T08:15:00+03:00"), actor: "Hodan Moussa Ibrahim", text: "a déclaré un incident critique (groupe froid) — MS-26-1058", tone: "danger", companyId: "cmp-bts", link: { kind: "incident", id: "i02" } },
  { id: "a06", at: iso("2026-11-08T07:40:00+03:00"), actor: "Mahamoud Aden Bouh", text: "a signalé un retard au poste de Guelilé — MS-26-1054", tone: "warning", companyId: "cmp-hfl", link: { kind: "mission", id: "m14" } },
  { id: "a07", at: iso("2026-11-08T07:05:00+03:00"), actor: "Said Ahmed Mohamed", text: "a déclaré une panne (crevaison) — MS-26-1060", tone: "danger", companyId: "cmp-hts", link: { kind: "incident", id: "i03" } },
  { id: "a08", at: iso("2026-11-08T06:30:00+03:00"), actor: "Exploitation RS", text: "a lancé la mission MS-26-1055 vers Dikhil", tone: "info", companyId: "cmp-rsh", link: { kind: "mission", id: "m15" } },
  { id: "a09", at: iso("2026-11-07T12:00:00+03:00"), actor: "Abdi Nour Aden", text: "a livré la mission MS-26-1052 à PK12", tone: "success", companyId: "cmp-bts", link: { kind: "mission", id: "m12" } },
  { id: "a10", at: iso("2026-11-07T14:30:00+03:00"), actor: "Exploitation RS", text: "a créé la mission MS-26-1070 (à affecter)", tone: "info", companyId: "cmp-rsh", link: { kind: "mission", id: "m30" } },
];

// ── Statistiques mensuelles (historique consolidé fictif) ────
const months = ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
const missionCounts = [118, 124, 131, 127, 142, 138, 151, 147, 156, 163, 171, 64];
const delayCounts = [14, 15, 13, 12, 14, 12, 13, 11, 12, 11, 10, 6];
const incidentCounts = [9, 11, 8, 10, 9, 8, 9, 7, 8, 7, 9, 11];
const usage = [68, 70, 72, 71, 75, 74, 78, 77, 80, 82, 84, 79];
export const monthly: MonthlyStat[] = months.map((month, i) => ({
  month,
  missions: missionCounts[i],
  delays: delayCounts[i],
  onTime: missionCounts[i] - delayCounts[i],
  incidents: incidentCounts[i],
  fleetUsage: usage[i],
}));

// ── Cohérence : statuts des camions et chauffeurs dérivés des missions ──
function reconcile(trucks: Truck[], drivers: Driver[], missions: Mission[]) {
  const active = missions.filter((m) => m.step >= 2 && m.step <= 5);
  const busyTrucks = new Set(active.map((m) => m.truckId).filter(Boolean));
  const busyDrivers = new Set(active.map((m) => m.driverId).filter(Boolean));
  return {
    trucks: trucks.map((t) => (busyTrucks.has(t.id) ? { ...t, status: "en_mission" as const } : t)),
    drivers: drivers.map((d) => (busyDrivers.has(d.id) ? { ...d, availability: "en_mission" as const } : d)),
  };
}

export function createSeed(): AppData {
  const { trucks, drivers } = reconcile(trucksBase, driversBase, missionsBase);
  return {
    version: DATA_VERSION,
    companies: structuredClone(companies),
    carriers: structuredClone(carriers),
    trucks,
    drivers,
    missions: structuredClone(missionsBase),
    loads: structuredClone(loadsBase),
    incidents: structuredClone(incidents),
    notifications: structuredClone(notifications),
    activity: structuredClone(activity),
    monthly: structuredClone(monthly),
    settings: {
      userName: "Nima Djama Farah",
      userEmail: "admin@logitrack.dj",
      userPhone: "+253 77 00 00 00",
      organisation: "LogiTrack — Administration plateforme",
      emailAlerts: true,
      smsAlerts: false,
      incidentAlerts: true,
      delayAlerts: true,
      weeklyReport: true,
      delayThresholdMin: 30,
      compactTables: false,
    },
    prefs: { companyId: "cmp-hfl", driverId: "d01" },
  };
}
