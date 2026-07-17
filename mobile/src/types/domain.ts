export type RoomType =
  | "Kitchen"
  | "Bathroom"
  | "Living Room"
  | "Bedroom"
  | "Dining Room"
  | "Office"
  | "Flex Room"
  | "Basement"
  | "Laundry Room"
  | "Entryway"
  | "Garage"
  | "Exterior"
  | "Other";

export const ROOM_TYPES: RoomType[] = [
  "Kitchen",
  "Bathroom",
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Office",
  "Flex Room",
  "Basement",
  "Laundry Room",
  "Entryway",
  "Garage",
  "Exterior",
  "Other",
];

export type GoalPath =
  | "sell_for_more"
  | "improve_my_home"
  | "buy_with_confidence"
  | "investor_analysis"
  | "just_exploring";

export type InvestorStrategy = "flip" | "rental" | "brrrr" | "keep_or_sell" | "not_sure";

export type StyleDirection =
  | "clean_and_neutral"
  | "modern_farmhouse"
  | "updated_traditional"
  | "modern_contemporary"
  | "budget_refresh"
  | "high_end_transformation";

export type UploadStatus = "pending" | "uploaded" | "processing" | "processed" | "failed";

export interface AnonymousSession {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningSession {
  id: string;
  anonymousSessionId: string;
  confirmedRoomType: RoomType | null;
  goalPath: GoalPath | null;
  investorStrategy: InvestorStrategy | null;
  styleDirection: StyleDirection | null;
  originalImageAssetId: string | null;
  enhancedImageAssetId: string | null;
  reportId: string | null;
  setupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadAuthorization {
  assetId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}

export interface CompleteAssetResponse {
  assetId: string;
  uploadStatus: UploadStatus;
  detectedRoomType: RoomType | null;
  roomTypeOptions: RoomType[];
}

export interface ProjectLevel {
  name: "Minimum Prep" | "Smart Refresh" | "Full Transformation";
  costRange: string;
  timeline: string;
  bestFor: string;
  tasks: string[];
  pros: string[];
  cons: string[];
}

export interface PriorityChecklistItem {
  task: string;
  why: string;
  costRange: string;
  difficulty: "DIY" | "Pro";
  impact: "High" | "Medium" | "Low";
}

export interface SellerAdvice {
  buyersNoticeFirst: string[];
  possibleObjections: string[];
  worthDoingBeforeListing: string[];
  avoidOverImproving: string[];
  photoReadinessTips: string[];
}

export interface BuyerAdvice {
  cosmeticItems: string[];
  mayNeedInspection: string[];
  budgetCushionAdvice: string;
  questionsToAsk: string[];
  negotiationConsiderations: string[];
}

export interface HomeownerAdvice {
  comfortAndFunction: string[];
  designOptions: string[];
  livabilityUpgrades: string[];
  doNowVsLater: string;
  whereToAvoidWastingMoney: string[];
}

export interface InvestorAdvice {
  bestScopeForStrategy: string;
  strategyConsiderations: string[];
  overImprovementWarning: string;
  durableMaterialSuggestions: string[];
  rentReadyVsResaleReady: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface DesignDirection {
  wallColorFamily: string;
  trimColor: string;
  flooringDirection: string;
  lightingStyle: string;
  hardwareFinish: string;
  stagingDirection: string;
  accentIdeas: string[];
}

export interface BudgetRanges {
  minimumPrep: string;
  smartRefresh: string;
  fullTransformation: string;
  disclaimer: string;
}

export interface ReportJson {
  summary: {
    roomType: string;
    goal: string;
    styleDirection: string;
    recommendedProjectLevel: string;
    bestNextMove: string;
    priorityScore: number;
  };
  observations: { title: string; detail: string }[];
  projectLevels: ProjectLevel[];
  priorityChecklist: PriorityChecklistItem[];
  sellerAdvice: SellerAdvice | null;
  buyerAdvice: BuyerAdvice | null;
  homeownerAdvice: HomeownerAdvice | null;
  investorAdvice: InvestorAdvice | null;
  designDirection: DesignDirection;
  budget: BudgetRanges;
  shoppingList: string[];
  warnings: string[];
  finalRecommendation: string;
  disclaimer: string;
}

export interface Report {
  id: string;
  planningSessionId: string;
  reportJson: ReportJson;
  summary: string | null;
  generatedAt: string;
  version: number;
}

export interface Lead {
  id: string;
  planningSessionId: string;
  name: string | null;
  email: string;
  phone: string | null;
  propertyAddress: string | null;
  intent: "selling" | "buying" | "investing" | "improving" | null;
  createdAt: string;
}
