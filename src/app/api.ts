import { getCurrentSession } from './auth/cognito';

const API_BASE = "/api";

let _token: string | null = localStorage.getItem("access_token");
let _cognitoId: string | null = localStorage.getItem("cognito_id");

export function setToken(token: string) {
  _token = token;
  localStorage.setItem("access_token", token);
}

export function getToken() {
  return _token;
}

export function setCognitoId(id: string) {
  _cognitoId = id;
  localStorage.setItem("cognito_id", id);
}

export function getCognitoId() {
  return _cognitoId;
}

export function clearAuth() {
  _token = null;
  _cognitoId = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("cognito_id");
}

// 매 요청 전 Cognito 세션에서 유효한 토큰 확보
async function getFreshToken(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const token = session.getIdToken().getJwtToken();
  setToken(token);
  return token;
}

async function requestFormData(path: string, formData: FormData) {
  const token = await getFreshToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: formData, headers });
  if (res.status === 401) { clearAuth(); throw new Error("401"); }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getFreshToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    throw new Error("401");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth (dev only)
  getDevToken: (cognitoId: string) =>
    fetch(`/dev/token/${cognitoId}`).then((r) => r.json()),

  // Profile
  getProfile: (cognitoId: string) => request(`/users/${cognitoId}`),
  updateProfile: (cognitoId: string, data: any) =>
    request(`/users/${cognitoId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Supplements (mypage)
  getSupplements: (cognitoId: string, isActive?: boolean) => {
    const params = new URLSearchParams({ cognito_id: cognitoId });
    if (isActive !== undefined) params.set("is_active", String(isActive));
    return request(`/users/supplements?${params}`);
  },
  createSupplement: (data: any) =>
    request("/users/supplements", { method: "POST", body: JSON.stringify(data) }),
  updateSupplement: (id: number, data: any) =>
    request(`/users/supplements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSupplement: (id: number) =>
    request(`/users/supplements/${id}`, { method: "DELETE" }),
  toggleSupplementStatus: (id: number, isActive: boolean) =>
    request(`/users/supplements/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ ans_is_active: isActive }),
    }),
  scanSupplement: (imageFile: File, cognitoId: string) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("cognito_id", cognitoId);
    return requestFormData("/users/supplements/scan", formData);
  },

  // History
  getIntakeSupplements: (cognitoId: string, isActive?: boolean) => {
    const params = new URLSearchParams({ cognito_id: cognitoId });
    if (isActive !== undefined) params.set("is_active", String(isActive));
    return request(`/history/supplements?${params}`);
  },
  getRecords: (cognitoId: string, year: number, month: number) =>
    request(`/history/records?cognito_id=${cognitoId}&year=${year}&month=${month}`),
  upsertRecord: (cognitoId: string, currentId: number, date: string, takenCount: number) =>
    request("/history/records", {
      method: "POST",
      body: JSON.stringify({ cognito_id: cognitoId, current_id: currentId, date, taken_count: takenCount }),
    }),

  // Analysis
  getAnalysisHistory: (cognitoId: string, limit = 10, offset = 0) =>
    request(`/chatbot/analysis/history?cognito_id=${cognitoId}&limit=${limit}&offset=${offset}`),
  startAnalysis: (data: {
    cognito_id: string;
    health_check_data: { exam_date: string; gender: number; age: number; height: number; weight: number };
    purposes: string[];
  }) => request("/analysis/calculate", { method: "POST", body: JSON.stringify(data) }),
  getAnalysisResult: (resultId: number, cognitoId: string) =>
    request(`/analysis/result/${resultId}?cognito_id=${cognitoId}`),
  getRecommendations: (resultId: number, cognitoId: string) =>
    request(`/analysis/recommendations/${resultId}?cognito_id=${cognitoId}`),

  // CODEF — 년도·날짜 범위는 백엔드에서 자동 계산하므로 프론트에서 전송 불필요
  codefInit: (userInfo: {
    user_name: string;
    phone_no: string;
    identity: string;
    nhis_id: string;
  }) => request("/codef/init", { method: "POST", body: JSON.stringify(userInfo) }),
  codefFetch: (payload: {
    cognito_id: string;
    user_info: object;
    health_check_two_way: object;
    prescription_two_way: object;
    token: string;
    hc_start_year?: string;
    hc_end_year?: string;
    presc_start?: string;
    presc_end?: string;
  }) => request("/codef/fetch", { method: "POST", body: JSON.stringify(payload) }),

  // Chatbot
  getChatHistory: (resultId: string, cognitoId: string) =>
    request(`/chatbot/history/${resultId}?cognito_id=${cognitoId}`),
  sendChatMessage: (cognitoId: string, resultId: string, message: string) =>
    request("/chatbot/message", {
      method: "POST",
      body: JSON.stringify({ cognito_id: cognitoId, result_id: resultId, message }),
    }),
  getHealthData: (cognitoId: string) =>
    request(`/codef/health-data/${cognitoId}`),
};
