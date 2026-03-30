import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { getCurrentSession, signOut as cognitoSignOut } from "./cognito";
import { setToken, clearAuth, setCognitoId } from "../api";

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
    if (payload.iat) localStorage.setItem('last_login_at', String(payload.iat));
    setUser(authUser);
  }, []);

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

  const logout = useCallback(() => {
    cognitoSignOut();
    clearAuth();
    setUser(null);
  }, []);

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
