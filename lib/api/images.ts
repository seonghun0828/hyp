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
 */
export async function generateImage(payload: GenerateImageParams): Promise<GenerateImageResponse> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = new Error('Image generation failed');
    (error as any).status = response.status;
    throw error;
  }

  return await response.json();
}
