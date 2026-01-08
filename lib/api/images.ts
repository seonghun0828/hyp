import { Styles, ProductSummary } from '@/lib/store';

interface GenerateImageParams {
  summary: ProductSummary;
  styles: Styles;
  variationIndex: number;
  randomSeed?: number;
}

interface GenerateImageResponse {
  imageUrl: string;
  imagePrompt: string;
}

/**
 * 이미지 생성 요청을 보냅니다.
 * 500번대 에러 발생 시 3초 후 1회 재시도합니다.
 */
export async function generateImage(
  payload: GenerateImageParams,
  retryCount = 0
): Promise<GenerateImageResponse> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // 500번대 에러이고, 아직 재시도를 안 했다면 (retryCount === 0)
    if (response.status >= 500 && retryCount < 1) {
      console.log(
        `Image generation failed with status ${response.status}. Retrying in 3 seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return generateImage(payload, retryCount + 1);
    }

    const error = new Error('Image generation failed');
    (error as any).status = response.status;
    throw error;
  }

  return await response.json();
}
