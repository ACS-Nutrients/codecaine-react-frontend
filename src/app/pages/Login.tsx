import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signIn, cognitoErrorMessage } from "../auth/cognito";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await signIn(email, password);
      login(session);
      navigate("/", { replace: true });
    } catch (err: any) {
      if (err.code === "UserNotConfirmedException") {
        navigate("/confirm-signup", { state: { email } });
      } else {
        setError(cognitoErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="로고" className="w-48 h-48 object-contain mx-auto mb-2" />
          <p className="text-gray-500 text-sm mt-1">영양제 추천 서비스</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-sm">
            <Link
              to="/forgot-password"
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
            <Link
              to="/signup"
              className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
