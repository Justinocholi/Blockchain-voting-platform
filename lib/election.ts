// Mock election data for the NaijaVote demo.
// NOTE: All names, parties and units are fictional and for demonstration only.

export type Candidate = {
  id: string;
  name: string;
  party: string;
  abbr: string;
  color: string;
};

export type PollingUnit = {
  id: string;
  name: string;
  state: string;
};

export const ELECTION = {
  id: "PRES-2027-DEMO",
  title: "2027 Presidential Election",
  subtitle: "Demonstration / simulation only — not a real election",
};

export const CANDIDATES: Candidate[] = [
  { id: "c1", name: "Adebayo Okonkwo", party: "Unity Progressive Party", abbr: "UPP", color: "#1f9d55" },
  { id: "c2", name: "Fatima Bello", party: "National Democratic Alliance", abbr: "NDA", color: "#2b6cb0" },
  { id: "c3", name: "Chinedu Eze", party: "People's Renaissance Movement", abbr: "PRM", color: "#dd6b20" },
  { id: "c4", name: "Aisha Mohammed", party: "Grassroots Justice Congress", abbr: "GJC", color: "#805ad5" },
];

export const POLLING_UNITS: PollingUnit[] = [
  { id: "PU-001", name: "Yaba Ward I — St. Finbarr's Hall", state: "Lagos" },
  { id: "PU-014", name: "Nassarawa Ward — Central Primary School", state: "Kano" },
  { id: "PU-027", name: "Diobu Ward — Community Town Hall", state: "Rivers" },
  { id: "PU-033", name: "Garki Ward — Area 3 Hall", state: "FCT Abuja" },
];

// The polling unit the demo voter is assigned to.
export const MY_POLLING_UNIT = "PU-001";

export function candidateById(id: string): Candidate | undefined {
  return CANDIDATES.find((c) => c.id === id);
}

export function pollingUnitById(id: string): PollingUnit | undefined {
  return POLLING_UNITS.find((p) => p.id === id);
}
