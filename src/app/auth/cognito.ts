import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;

export const userPool = new CognitoUserPool({
  UserPoolId: POOL_ID,
  ClientId: CLIENT_ID,
});

// ── 로그인 ────────────────────────────────────────────────────────────────────
export function signIn(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    user.authenticateUser(authDetails, {
      onSuccess: resolve,
      onFailure: reject,
      newPasswordRequired: (_userAttributes) => {
        reject({ code: "NewPasswordRequired", user });
      },
    });
  });
}

// ── 회원가입 ──────────────────────────────────────────────────────────────────
export function signUp(
  email: string,
  password: string,
  name: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    userPool.signUp(email, password, attrs, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── 이메일 인증코드 확인 ──────────────────────────────────────────────────────
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── 인증코드 재발송 ───────────────────────────────────────────────────────────
export function resendConfirmCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── 비밀번호 재설정 요청 ──────────────────────────────────────────────────────
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

// ── 비밀번호 재설정 확인 ──────────────────────────────────────────────────────
export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
export function signOut(): void {
  const user = userPool.getCurrentUser();
  user?.signOut();
}

// ── 현재 세션 토큰 가져오기 ───────────────────────────────────────────────────
export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) resolve(null);
      else resolve(session);
    });
  });
}

// Cognito 에러코드 → 한국어 메시지
export function cognitoErrorMessage(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case "UserNotFoundException":
      return "등록되지 않은 이메일입니다.";
    case "NotAuthorizedException":
      return "비밀번호가 올바르지 않습니다.";
    case "UserNotConfirmedException":
      return "이메일 인증이 완료되지 않았습니다.";
    case "UsernameExistsException":
      return "이미 사용 중인 이메일입니다.";
    case "CodeMismatchException":
      return "인증코드가 올바르지 않습니다.";
    case "ExpiredCodeException":
      return "인증코드가 만료됐습니다. 재발송해 주세요.";
    case "InvalidPasswordException":
      return "비밀번호는 8자 이상이며 대문자, 숫자, 특수문자를 포함해야 합니다.";
    case "LimitExceededException":
      return "요청이 너무 많습니다. 잠시 후 시도해 주세요.";
    case "InvalidParameterException":
      return err.message ?? "입력값이 올바르지 않습니다.";
    default:
      return err.message ?? "오류가 발생했습니다.";
  }
}
