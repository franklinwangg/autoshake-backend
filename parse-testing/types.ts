export interface JobSearchResponse {
  data: {
    jobSearch: JobSearch;
  };
}

export interface JobSearch {
  totalCount: number;
  searchId: string;
  edges: JobSearchEdge[];
}

export interface JobSearchEdge {
  node: JobSearchNode;
}

export interface JobSearchNode {
  id: string;
  isPromoted: boolean;
  shouldPromote: boolean;
  job: JobSummary;
}

//
// ---------------- Job Summary ----------------
//

export interface JobSummary {
  id: string;
  title: string;
  jobType: JobType;
  employmentType: EmploymentType;
  workStudy: boolean;
  duration: string; // e.g. "PERMANENT"
  startDate: string | null;
  endDate: string | null;
  remote: boolean;
  onSite: boolean;
  hybrid: boolean;
  workLocationType: string; // e.g. "SPECIFIC"
  locations: JobLocation[];
  salaryRange: SalaryRange | null;
  salaryType: SalaryType;
  applyStart: string;
  hasEarlyApplicantStatus: boolean;
  schoolCurationsForCurrentUser: any[];
  employer: EmployerSummary;
  isUpgraded: boolean;
  createdAt: string;
  expirationDate: string;
  remunerations: Remuneration[];
  additionalBenefitsLink: string;
  payCurrencyCode: string;
  description: string;
  workSchedule: string | null;
  studentScreen: StudentScreenSummary;
  attachments: any[]; 
  follow: any | null;
  aiFitCheckEnabled: boolean;
}

//
// ---------------- Job Metadata ----------------
//

export interface JobType {
  id: string;
  behaviorIdentifier: string; // e.g. "JOB"
  name: string; // e.g. "Job"
}

export interface EmploymentType {
  id: string;
  behaviorIdentifier: string; // e.g. "FULL_TIME"
  name: string; // e.g. "Full-Time"
}

export interface JobLocation {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  name: string;
  city: string;
  state: string;
  country: string;
}

//
// ---------------- Salary ----------------
//

export interface SalaryRange {
  id: string;
  min: number;
  max: number;
  currency: string;
  paySchedule: PaySchedule;
}

export interface PaySchedule {
  id: string;
  behaviorIdentifier: string; // e.g. "ANNUAL_SALARY"
  friendlyName: string; // e.g. "Per year"
  name: string; // e.g. "Annual Salary"
}

export interface SalaryType {
  id: string;
  behaviorIdentifier: string; // e.g. "PAID"
  name: string;
}

//
// ---------------- Employer ----------------
//

export interface EmployerSummary {
  id: string;
  name: string;
  logo: Image;
  industry: Industry;
}

export interface Image {
  url: string;
}

export interface Industry {
  id: string;
  name: string;
}

//
// ---------------- Benefits / Perks ----------------
//

export interface Remuneration {
  id: string;
  behaviorIdentifier: string; // e.g. "Medical", "Vision"
}

//
// ---------------- Student Screen ----------------
//

export interface StudentScreenSummary {
  id: string;
  acceptsCptCandidates: boolean;
  acceptsOptCandidates: boolean;
  acceptsOptCptCandidates: boolean;
  workAuthRequired: boolean;
  workAuthNotDisclosed: boolean;
  willingToSponsorCandidate: boolean;
}

////////////////

export interface HandshakeJobResponse {
  data: {
    job: JobSearchResultJob;
    currentUser: CurrentUser;
  };
}

/* -------------------- JOB -------------------- */

export interface JobSearchResultJob {
  id: string;
  title: string;
  createdAt: string;
  expirationDate: string;
  employer: Employer;
  __typename: "Job";
  remunerations: Remuneration[];
  additionalBenefitsLink: string;
  salaryRange: SalaryRange | null;
  salaryType: SalaryTypeOption | null;
  payCurrencyCode: string | null;
  description: string;
  hybrid: boolean;
  remote: boolean;
  onSite: boolean;
  locations: Location[];
  workLocationType: string;
  startDate: string | null;
  endDate: string | null;
  jobType: JobTypeEnum;
  employmentType: EmploymentTypeEnum;
  workStudy: boolean;
  duration: string;
  workSchedule: string | null;
  studentScreen: StudentScreen | null;
  attachments: any[];
  follow: any | null;
  aiFitCheckEnabled: boolean;
}

/* -------------------- EMPLOYER -------------------- */

export interface Employer {
  id: string;
  name: string;
  logo: Image | null;
  industry: Industry | null;
  __typename: "Employer";
}

export interface Image {
  url: string;
  __typename: "Image";
}

export interface Industry {
  id: string;
  name: string;
  __typename: "Industry";
}

/* -------------------- REMUNERATION -------------------- */

export interface Remuneration {
  id: string;
  behaviorIdentifier: string;
  __typename: "Remuneration";
}

/* -------------------- SALARY -------------------- */

export interface SalaryRange {
  id: string;
  min: number;
  max: number;
  currency: string;
  paySchedule: PaySchedule;
  __typename: "Salary";
}

export interface PaySchedule {
  id: string;
  behaviorIdentifier: string;
  name: string;
  friendlyName: string;
  __typename: "PaySchedule";
}

export interface SalaryTypeOption {
  id: string;
  name: string;
  behaviorIdentifier: string;
  __typename: "SalaryTypeOption";
}

/* -------------------- LOCATION -------------------- */

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  __typename: "Location";
}

/* -------------------- JOB TYPE / EMPLOYMENT TYPE -------------------- */

export interface JobTypeEnum {
  id: string;
  name: string;
  behaviorIdentifier: string;
  __typename: "JobTypeEnum";
}

export interface EmploymentTypeEnum {
  id: string;
  name: string;
  behaviorIdentifier: string;
  __typename: "EmploymentTypeEnum";
}

/* -------------------- STUDENT SCREEN -------------------- */

export interface StudentScreen {
  id: string;
  acceptsCptCandidates: boolean;
  acceptsOptCandidates: boolean;
  acceptsOptCptCandidates: boolean;
  workAuthRequired: boolean;
  workAuthNotDisclosed: boolean;
  willingToSponsorCandidate: boolean;
  __typename: "StudentScreen";
}

/* -------------------- CURRENT USER -------------------- */

export interface CurrentUser {
  id: string;
  slug: string;
  locationInterests: Interest[];
}

export interface Interest {
  id: string;
  interesting: Location;
  __typename: "Interest";
}

////////////////////////

export interface JobDetailsResponse {
  data: {
    job: JobDetailsJob;
    studentEmployeeProfiles: any[];
    documentTypes: DocumentTypeEnum[];
  };
}

/* -------------------- JOB -------------------- */

export interface JobDetailsJob {
  id: string;
  __typename: "Job";
  follow: any | null;
  isUpgraded: boolean;

  employer: Employer;

  applyStart: string;
  jobApplySetting: JobApplySetting;

  screeningQuestions: any[];
  atsIntegrated: boolean;
  expirationDate: string;

  requiredDocumentTypes: DocumentTypeEnum[];

  title: string;

  atsProvider: any | null;
  attachments: any[];
  otherDocumentNotes: any | null;
  atsDetail: any | null;

  studentScreen: StudentScreen;
  relationshipOpportunities: any[];

  jobContactableUsers: JobUserProfile[];
}

/* -------------------- EMPLOYER -------------------- */

export interface Employer {
  id: string;
  __typename: "Employer";
  name: string;
  follow: any | null;
  hasEnabledJobApplyTracking: boolean;

  institutionSize: InstitutionSize;

  location: Location;

  schoolCurations: any[];
  description: string;

  logo: Image | null;
  industry: Industry | null;
}

export interface InstitutionSize {
  id: string;
  name: string;
  __typename: "InstitutionSize";
}

export interface Location {
  id: string;
  city: string;
  state: string;
  country: string;
  name: string;
  __typename: "Location";
}

export interface Image {
  url: string;
  __typename: "Image";
}

export interface Industry {
  id: string;
  name: string;
  __typename: "Industry";
}

/* -------------------- JOB APPLY SETTING -------------------- */

export interface JobApplySetting {
  id: string;
  applyType: string; // "HANDSHAKE"
  externalApplyType: string; // "URL"
  additionalInstructions: string | null;
  externalUrl: string;
  alternativeExternalUrl: string | null;
  __typename: "JobApplySetting";
}

/* -------------------- DOCUMENT TYPES -------------------- */

export interface DocumentTypeEnum {
  id: string;
  behaviorIdentifier: string; // "RESUME", "COVER_LETTER", etc.
  name: string;
  __typename: "DocumentTypeEnum";
}

/* -------------------- STUDENT SCREEN -------------------- */

export interface StudentScreen {
  id: string;
  workAuthorizationCountries: any[];
  __typename: "StudentScreen";
}

/* -------------------- CONTACTABLE USERS -------------------- */

export interface JobUserProfile {
  id: string;
  __typename: "JobUserProfile";
  user: JobContactUser;
}

export interface JobContactUser {
  id: string;
  __typename: "User";
  firstName: string;
  lastName: string;
  userProfilePhotoUrl: string;
  title: string;
  name: string;
  calculatedFirstName: string;
  userType: string; // "EMPLOYERS"
  institution: {
    __typename: "Employer";
    id: string;
    name: string;
  };
}
