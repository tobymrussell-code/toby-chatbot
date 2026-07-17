import { devError, devLog } from "../utils/log";
import type {
  AnonymousSession,
  CompleteAssetResponse,
  GoalPath,
  InvestorStrategy,
  Lead,
  PlanningSession,
  Report,
  RoomType,
  StyleDirection,
  UploadAuthorization,
} from "../types/domain";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.42:3000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  devLog(`request ${init?.method || "GET"} ${path}`, init?.body ? JSON.parse(String(init.body)) : undefined);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    devError(`network error on ${path}`, err);
    throw new ApiError(
      "We could not reach the renovation server. Make sure your phone and computer are on the same Wi-Fi, then try again.",
      0
    );
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    devError(`error response from ${path}`, data);
    const message = data?.error?.message || "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }

  devLog(`response ${path}`, data);
  return data as T;
}

export const api = {
  createAnonymousSession(): Promise<AnonymousSession> {
    return request("/anonymous-sessions", { method: "POST", body: JSON.stringify({}) });
  },

  createPlanningSession(anonymousSessionId: string): Promise<PlanningSession> {
    return request("/planning-sessions", {
      method: "POST",
      body: JSON.stringify({ anonymousSessionId }),
    });
  },

  getPlanningSession(id: string): Promise<PlanningSession> {
    return request(`/planning-sessions/${id}`);
  },

  updatePlanningSetup(
    id: string,
    setup: { goalPath?: GoalPath; investorStrategy?: InvestorStrategy | null; styleDirection?: StyleDirection }
  ): Promise<PlanningSession> {
    return request(`/planning-sessions/${id}/setup`, {
      method: "PATCH",
      body: JSON.stringify(setup),
    });
  },

  createUploadAuthorization(params: {
    planningSessionId: string;
    mimeType: string;
    byteSize: number;
    width: number;
    height: number;
  }): Promise<UploadAuthorization> {
    return request("/photo-intake/upload-authorizations", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  completeAsset(assetId: string): Promise<CompleteAssetResponse> {
    return request(`/photo-intake/assets/${assetId}/complete`, { method: "POST", body: JSON.stringify({}) });
  },

  getDownloadAuthorization(assetId: string): Promise<{ assetId: string; downloadUrl: string; expiresAt: string }> {
    return request(`/photo-intake/assets/${assetId}/download-authorizations`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  confirmRoomType(planningSessionId: string, confirmedRoomType: RoomType): Promise<PlanningSession> {
    return request("/photo-intake/room-confirmations", {
      method: "POST",
      body: JSON.stringify({ planningSessionId, confirmedRoomType }),
    });
  },

  generateReport(planningSessionId: string): Promise<Report> {
    return request("/reports", { method: "POST", body: JSON.stringify({ planningSessionId }) });
  },

  getReport(id: string): Promise<Report> {
    return request(`/reports/${id}`);
  },

  createLead(lead: {
    planningSessionId: string;
    name?: string;
    email: string;
    phone?: string;
    propertyAddress?: string;
    intent?: "selling" | "buying" | "investing" | "improving";
  }): Promise<Lead> {
    return request("/leads", { method: "POST", body: JSON.stringify(lead) });
  },
};
