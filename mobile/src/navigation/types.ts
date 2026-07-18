export type ProcessingMode = "photo" | "report";

export type RootStackParamList = {
  Welcome: undefined;
  Processing: { mode: ProcessingMode; asset?: { uri: string; width: number; height: number } };
  RoomConfirmation: undefined;
  ProjectGoal: undefined;
  InvestorStrategy: undefined;
  StyleDirection: undefined;
  Report: undefined;
  LeadCapture: undefined;
};
