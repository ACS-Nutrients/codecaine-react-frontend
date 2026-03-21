import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signUp, cognitoErrorMessage } from "../auth/cognito";

export function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate("/confirm-signup", { state: { email } });
    } catch (err: any) {
      // NotAuthorizedException은 회원가입 시 "self sign-up 비활성화" 의미일 수 있음
      // → 원본 메시지를 함께 표시해 원인 파악을 돕는다
      if (err.code === "NotAuthorizedException") {
        setError(`회원가입이 허용되지 않습니다. (${err.message})`);
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
        <div className="text-center mb-8">
          <img src="/logo-1.png" alt="로고" className="w-48 h-48 object-contain mx-auto mb-2" />
          <p className="text-gray-500 text-sm mt-1">영양제 추천 서비스</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="홍길동"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8자 이상, 대문자·숫자·특수문자 포함"
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
