'use client';

import { FormEvent, useState } from 'react';
import { Loader2, Sparkles, Upload, Wrench } from 'lucide-react';

type IdentifiedPart = {
  partNameAr: string;
  partNameEn: string;
  confidence: number;
  compatibleBrands: string[];
  possibleIssues: string[];
  recommendedParts: string[];
  notes: string;
};

type FaultAnalysis = {
  faultType: string;
  severity: 'low' | 'medium' | 'high';
  affectedParts: string[];
  estimatedCostUsd: number;
  urgency: string;
  recommendedAction: string;
};

type ApiResult<T> = { success: true; result: T } | { success: false; error: string };

export default function AdminVisionPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [identifyResult, setIdentifyResult] = useState<IdentifiedPart | null>(null);
  const [faultResult, setFaultResult] = useState<FaultAnalysis | null>(null);
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [faultLoading, setFaultLoading] = useState(false);
  const [error, setError] = useState('');

  const handleIdentify = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setIdentifyLoading(true);
    setError('');
    setIdentifyResult(null);

    try {
      const res = await fetch('/api/admin/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'identifyPart', imageUrl }),
      });
      const data: ApiResult<IdentifiedPart> = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      setIdentifyResult(data.result);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setIdentifyLoading(false);
    }
  };

  const handleAnalyzeFault = async (e: FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setFaultLoading(true);
    setError('');
    setFaultResult(null);

    try {
      const res = await fetch('/api/admin/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyzeFault',
          description,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data: ApiResult<FaultAnalysis> = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      setFaultResult(data.result);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setFaultLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Sparkles className="h-6 w-6 text-blue-600" />
            وكيل الرؤية الذكي
          </h1>
          <p className="text-sm text-slate-600">
            ارفع رابط صورة قطعة غيار لاختبار التعرف الآلي عليها أو حلّل عطلاً من وصف نصي.
          </p>
        </header>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Upload className="h-5 w-5" />
            التعرف على القطعة من الصورة
          </h2>
          <form onSubmit={handleIdentify} className="space-y-3">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/part-image.jpg"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={identifyLoading || !imageUrl}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {identifyLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              تحليل الصورة
            </button>
          </form>

          {identifyResult && (
            <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">الاسم بالعربية:</span>
                <span className="font-medium text-slate-900">{identifyResult.partNameAr}</span>
                <span className="text-slate-500">الاسم بالإنجليزية:</span>
                <span className="font-medium text-slate-900">{identifyResult.partNameEn}</span>
                <span className="text-slate-500">درجة الثقة:</span>
                <span className="font-medium text-slate-900">
                  {Math.round(identifyResult.confidence * 100)}%
                </span>
              </div>
              {identifyResult.compatibleBrands.length > 0 && (
                <div>
                  <p className="text-slate-500">الماركات المتوافقة:</p>
                  <p className="text-slate-900">{identifyResult.compatibleBrands.join('، ')}</p>
                </div>
              )}
              {identifyResult.possibleIssues.length > 0 && (
                <div>
                  <p className="text-slate-500">الأعطال المحتملة:</p>
                  <ul className="list-inside list-disc text-slate-900">
                    {identifyResult.possibleIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {identifyResult.recommendedParts.length > 0 && (
                <div>
                  <p className="text-slate-500">قطع موصى بها:</p>
                  <p className="text-slate-900">{identifyResult.recommendedParts.join('، ')}</p>
                </div>
              )}
              {identifyResult.notes && (
                <p className="rounded bg-blue-50 p-2 text-blue-900">{identifyResult.notes}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Wrench className="h-5 w-5" />
            تحليل العطل
          </h2>
          <form onSubmit={handleAnalyzeFault} className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: الغسالة لا تخرج الماء أثناء العصر"
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={faultLoading || !description}
              className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {faultLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              تشخيص العطل
            </button>
          </form>

          {faultResult && (
            <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">نوع العطل:</span>
                <span className="font-medium text-slate-900">{faultResult.faultType}</span>
                <span className="text-slate-500">الخطورة:</span>
                <span className="font-medium text-slate-900">{faultResult.severity}</span>
                <span className="text-slate-500">التكلفة المقدّرة:</span>
                <span className="font-medium text-slate-900">${faultResult.estimatedCostUsd}</span>
                <span className="text-slate-500">الإلحاح:</span>
                <span className="font-medium text-slate-900">{faultResult.urgency}</span>
              </div>
              {faultResult.affectedParts.length > 0 && (
                <div>
                  <p className="text-slate-500">القطع المتأثرة:</p>
                  <p className="text-slate-900">{faultResult.affectedParts.join('، ')}</p>
                </div>
              )}
              <p className="rounded bg-emerald-50 p-2 text-emerald-900">
                {faultResult.recommendedAction}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
