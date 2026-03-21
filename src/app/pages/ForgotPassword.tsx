import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { forgotPassword, confirmForgotPassword, cognitoErrorMessage } from "../auth/cognito";

type Step = "email" | "reset";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("reset");
    } catch (err: any) {
      setError(cognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      navigate("/login", { state: { passwordReset: true } });
    } catch (err: any) {
      setError(cognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-layout.png" alt="로고" className="w-48 h-48 object-contain mx-auto mb-2" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === "email" ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">비밀번호 재설정</h2>
              <p className="text-sm text-gray-500 mb-6">
                가입한 이메일 주소를 입력하면 인증코드를 발송합니다.
              </p>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {loading ? "발송 중..." : "인증코드 발송"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">새 비밀번호 설정</h2>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-700">{email}</span>로 발송된 인증코드와
                새 비밀번호를 입력해 주세요.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">인증코드</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    placeholder="6자리 코드"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="8자 이상"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="비밀번호를 다시 입력하세요"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {loading ? "처리 중..." : "비밀번호 변경"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
