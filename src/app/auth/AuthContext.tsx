import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { getCurrentSession, signOut as cognitoSignOut } from "./cognito";
import { setToken, clearAuth, setCognitoId, setOnAuthExpired } from "../api";

interface AuthUser {
  cognitoId: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (session: CognitoUserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current);
      expireTimerRef.current = null;
    }
    cognitoSignOut();
    clearAuth();
    setUser(null);
  }, []);

  const applySession = useCallback((session: CognitoUserSession) => {
    const idToken = session.getIdToken();
    const payload = idToken.decodePayload();
    const token = idToken.getJwtToken();

    const authUser: AuthUser = {
      cognitoId: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    setToken(token);
    setCognitoId(payload.sub);
    setUser(authUser);

    // 토큰 만료 시각(exp)까지 남은 시간에 자동 로그아웃 타이머 설정
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry > 0) {
      expireTimerRef.current = setTimeout(logout, msUntilExpiry);
    } else {
      logout();
    }
  }, [logout]);

  // 앱 로드 시 기존 Cognito 세션 복구
  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) applySession(session);
      })
      .finally(() => setLoading(false));
  }, [applySession]);

  const login = useCallback(
    (session: CognitoUserSession) => {
      applySession(session);
    },
    [applySession]
  );

  // 세션 만료 시 자동 로그아웃 콜백 등록
  useEffect(() => {
    setOnAuthExpired(logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
