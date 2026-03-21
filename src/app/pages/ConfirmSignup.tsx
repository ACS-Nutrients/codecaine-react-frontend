import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { confirmSignUp, resendConfirmCode, cognitoErrorMessage } from "../auth/cognito";

export function ConfirmSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      navigate("/login", { state: { confirmed: true } });
    } catch (err: any) {
      setError(cognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await resendConfirmCode(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: any) {
      setError(cognitoErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="로고" className="w-48 h-48 object-contain mx-auto mb-2" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">이메일 인증</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{email}</span>으로 발송된
            인증코드를 입력해 주세요.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인증코드</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="6자리 코드"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center text-lg"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            {resent && (
              <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                인증코드를 재발송했습니다.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? "확인 중..." : "인증 완료"}
            </button>
          </form>

          <button
            onClick={handleResend}
            className="w-full mt-3 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium rounded-lg transition-colors text-sm"
          >
            인증코드 재발송
          </button>
        </div>
      </div>
    </div>
  );
}
