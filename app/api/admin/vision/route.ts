import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { analyzeFault, identifyPart } from '@/server/agents/visionAgent';

const bodySchema = z.union([
  z.object({
    action: z.literal('identifyPart'),
    imageUrl: z.string().url().max(500),
  }),
  z.object({
    action: z.literal('analyzeFault'),
    description: z.string().min(3).max(2000),
    imageUrl: z.string().url().max(500).optional(),
  }),
]);

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'طلب غير صالح' },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'مدخلات غير صالحة', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    if (parsed.data.action === 'identifyPart') {
      const result = await identifyPart(parsed.data.imageUrl);
      return NextResponse.json({ success: true, result });
    }

    const result = await analyzeFault(
      parsed.data.description,
      parsed.data.imageUrl,
    );
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[api/admin/vision] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'فشل تحليل الصورة',
      },
      { status: 500 },
    );
  }
}
