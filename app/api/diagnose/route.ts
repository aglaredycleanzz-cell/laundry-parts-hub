import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeFault, identifyPart } from '@/server/agents/visionAgent';
import type { FaultAnalysis, IdentifiedPart } from '@/server/agents/visionAgent';

const bodySchema = z.object({
  imageUrl: z.string().url().max(500).optional(),
  description: z.string().min(3).max(2000).optional(),
}).refine((d) => d.imageUrl || d.description, {
  message: 'يجب توفير صورة أو وصف للعطل',
});

export type DiagnoseResult = {
  part: IdentifiedPart | null;
  fault: FaultAnalysis;
};

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'مدخلات غير صالحة' },
      { status: 422 },
    );
  }

  const { imageUrl, description } = parsed.data;

  try {
    const [part, fault] = await Promise.all([
      imageUrl ? identifyPart(imageUrl).catch(() => null) : Promise.resolve(null),
      analyzeFault(description ?? 'لم يُحدَّد', imageUrl),
    ]);

    const result: DiagnoseResult = { part, fault };
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[api/diagnose]', error);
    return NextResponse.json(
      { success: false, error: 'فشل التشخيص، حاول مجدداً' },
      { status: 500 },
    );
  }
}
