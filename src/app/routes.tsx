import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { RecordHistory } from "./pages/RecordHistory";
import { Recommendation } from "./pages/Recommendation";
import { RecommendationResult } from "./pages/RecommendationResult";
import { Chatbot } from "./pages/Chatbot";
import { MyPage } from "./pages/MyPage";
import { AnalysisHistory } from "./pages/AnalysisHistory";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ConfirmSignup } from "./pages/ConfirmSignup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  // 인증 없이 접근 가능
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/confirm-signup", Component: ConfirmSignup },
  { path: "/forgot-password", Component: ForgotPassword },

  // 로그인 필요
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Home },
      { path: "record", Component: RecordHistory },
      { path: "recommendation", Component: Recommendation },
      { path: "recommendation-result", Component: RecommendationResult },
      { path: "chatbot", Component: Chatbot },
      { path: "my-page", Component: MyPage },
      { path: "analysis-history", Component: AnalysisHistory },
      { path: "settings", Component: Settings },
    ],
  },
]);
