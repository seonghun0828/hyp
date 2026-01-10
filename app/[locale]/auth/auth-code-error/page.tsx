export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">로그인 오류</h1>
      <p>인증 과정에서 문제가 발생했습니다. 다시 시도해주세요.</p>
      <a href="/" className="mt-4 text-blue-500 hover:underline">홈으로 돌아가기</a>
    </div>
  );
}

