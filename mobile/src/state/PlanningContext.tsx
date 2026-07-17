import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import { uploadPreparedPhoto } from "../api/upload";
import { preparePhotoForUpload } from "../utils/imagePrep";
import { devError, devLog } from "../utils/log";
import type {
  GoalPath,
  InvestorStrategy,
  Report,
  RoomType,
  StyleDirection,
} from "../types/domain";

export type PlanningStatus =
  | "idle"
  | "picking_photo"
  | "preparing_photo"
  | "uploading"
  | "processing"
  | "confirming_room"
  | "goal_selection"
  | "investor_strategy"
  | "style_direction"
  | "generating_report"
  | "report_ready"
  | "failed";

interface PlanningState {
  status: PlanningStatus;
  errorMessage: string | null;
  anonymousSessionId: string | null;
  planningSessionId: string | null;
  photoUri: string | null;
  assetId: string | null;
  detectedRoomType: RoomType | null;
  confirmedRoomType: RoomType | null;
  goalPath: GoalPath | null;
  investorStrategy: InvestorStrategy | null;
  styleDirection: StyleDirection | null;
  report: Report | null;
}

const initialState: PlanningState = {
  status: "idle",
  errorMessage: null,
  anonymousSessionId: null,
  planningSessionId: null,
  photoUri: null,
  assetId: null,
  detectedRoomType: null,
  confirmedRoomType: null,
  goalPath: null,
  investorStrategy: null,
  styleDirection: null,
  report: null,
};

interface PlanningContextValue extends PlanningState {
  ensureSession: () => Promise<string>;
  submitPhoto: (asset: { uri: string; width: number; height: number }) => Promise<RoomType | null>;
  confirmRoomType: (roomType: RoomType) => Promise<void>;
  chooseGoal: (goalPath: GoalPath) => Promise<void>;
  chooseInvestorStrategy: (strategy: InvestorStrategy) => Promise<void>;
  chooseStyle: (style: StyleDirection) => Promise<void>;
  buildReport: () => Promise<void>;
  startAnotherRoom: () => void;
  setErrorMessage: (message: string | null) => void;
}

const PlanningContext = createContext<PlanningContextValue | undefined>(undefined);

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlanningState>(initialState);

  const patch = useCallback((partial: Partial<PlanningState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (state.planningSessionId) return state.planningSessionId;

    let anonymousSessionId = state.anonymousSessionId;
    if (!anonymousSessionId) {
      const anon = await api.createAnonymousSession();
      anonymousSessionId = anon.id;
      devLog("anonymous session created", anon);
    }

    const planningSession = await api.createPlanningSession(anonymousSessionId);
    devLog("planning session created", planningSession);
    patch({ anonymousSessionId, planningSessionId: planningSession.id });
    return planningSession.id;
  }, [state.anonymousSessionId, state.planningSessionId, patch]);

  const submitPhoto = useCallback(
    async (asset: { uri: string; width: number; height: number }): Promise<RoomType | null> => {
      patch({ status: "preparing_photo", errorMessage: null, photoUri: asset.uri });
      try {
        const planningSessionId = await ensureSession();

        const prepared = await preparePhotoForUpload(asset);
        patch({ photoUri: prepared.uri, status: "uploading" });

        const auth = await api.createUploadAuthorization({
          planningSessionId,
          mimeType: prepared.mimeType,
          byteSize: prepared.byteSize,
          width: prepared.width,
          height: prepared.height,
        });

        await uploadPreparedPhoto(prepared.uri, auth);

        patch({ status: "processing", assetId: auth.assetId });
        const completion = await api.completeAsset(auth.assetId);
        devLog("photo intake complete", completion);

        patch({
          status: "confirming_room",
          detectedRoomType: completion.detectedRoomType,
        });
        return completion.detectedRoomType;
      } catch (err) {
        devError("submitPhoto failed", err);
        const message = err instanceof Error ? err.message : "Something went wrong preparing that photo.";
        patch({ status: "failed", errorMessage: message });
        throw err;
      }
    },
    [ensureSession, patch]
  );

  const confirmRoomType = useCallback(
    async (roomType: RoomType) => {
      if (!state.planningSessionId) throw new Error("No active planning session.");
      await api.confirmRoomType(state.planningSessionId, roomType);
      patch({ confirmedRoomType: roomType, status: "goal_selection" });
    },
    [state.planningSessionId, patch]
  );

  const chooseGoal = useCallback(
    async (goalPath: GoalPath) => {
      if (!state.planningSessionId) throw new Error("No active planning session.");
      await api.updatePlanningSetup(state.planningSessionId, { goalPath });
      const nextStatus = goalPath === "investor_analysis" ? "investor_strategy" : "style_direction";
      patch({ goalPath, status: nextStatus });
    },
    [state.planningSessionId, patch]
  );

  const chooseInvestorStrategy = useCallback(
    async (strategy: InvestorStrategy) => {
      if (!state.planningSessionId) throw new Error("No active planning session.");
      await api.updatePlanningSetup(state.planningSessionId, { investorStrategy: strategy });
      patch({ investorStrategy: strategy, status: "style_direction" });
    },
    [state.planningSessionId, patch]
  );

  const chooseStyle = useCallback(
    async (style: StyleDirection) => {
      if (!state.planningSessionId) throw new Error("No active planning session.");
      await api.updatePlanningSetup(state.planningSessionId, { styleDirection: style });
      patch({ styleDirection: style });
    },
    [state.planningSessionId, patch]
  );

  const buildReport = useCallback(async () => {
    if (!state.planningSessionId) throw new Error("No active planning session.");
    patch({ status: "generating_report", errorMessage: null });
    try {
      const report = await api.generateReport(state.planningSessionId);
      devLog("report generated", report);
      patch({ status: "report_ready", report });
    } catch (err) {
      devError("buildReport failed", err);
      const message = err instanceof Error ? err.message : "We could not build your renovation plan right now.";
      patch({ status: "failed", errorMessage: message });
      throw err;
    }
  }, [state.planningSessionId, patch]);

  const startAnotherRoom = useCallback(() => {
    setState((prev) => ({
      ...initialState,
      anonymousSessionId: prev.anonymousSessionId,
      status: "idle",
    }));
  }, []);

  const setErrorMessage = useCallback((message: string | null) => {
    patch({ errorMessage: message });
  }, [patch]);

  const value = useMemo<PlanningContextValue>(
    () => ({
      ...state,
      ensureSession,
      submitPhoto,
      confirmRoomType,
      chooseGoal,
      chooseInvestorStrategy,
      chooseStyle,
      buildReport,
      startAnotherRoom,
      setErrorMessage,
    }),
    [
      state,
      ensureSession,
      submitPhoto,
      confirmRoomType,
      chooseGoal,
      chooseInvestorStrategy,
      chooseStyle,
      buildReport,
      startAnotherRoom,
      setErrorMessage,
    ]
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning(): PlanningContextValue {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used within a PlanningProvider");
  return ctx;
}
