import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { base64Image } = await request.json();

    if (!base64Image) {
      return NextResponse.json(
        { error: 'base64Image is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration not available' },
        { status: 500 }
      );
    }

    // 서비스 역할 키를 사용하여 Storage 업로드 (서버 사이드 전용)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // base64 데이터에서 MIME 타입과 데이터 추출
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const mimeType =
      base64Image.match(/data:image\/(\w+);base64,/)?.[1] || 'png';
    const buffer = Buffer.from(base64Data, 'base64');

    // 고유한 파일명 생성 (UUID + 타임스탬프)
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${mimeType}`;
    const filePath = `generated-contents/${fileName}`;

    // Supabase Storage에 업로드 (서비스 역할 키 사용)
    const { data, error } = await supabaseAdmin.storage
      .from('generated-contents')
      .upload(filePath, buffer, {
        contentType: `image/${mimeType}`,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to storage', details: error.message },
        { status: 500 }
      );
    }

    // Public URL 가져오기
    const { data: urlData } = supabaseAdmin.storage
      .from('generated-contents')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload image API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
