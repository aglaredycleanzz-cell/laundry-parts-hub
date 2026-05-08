'use client';

import { useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  ChevronLeft,
  Loader2,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

/* ── types ── */
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

type DiagnoseResult = { part: IdentifiedPart | null; fault: FaultAnalysis };

type Step = 'input' | 'loading' | 'result' | 'sent';

const SEVERITY_LABEL: Record<FaultAnalysis['severity'], string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
};

const SEVERITY_COLOR: Record<FaultAnalysis['severity'], string> = {
  low: 'text-green-700 bg-green-50 border-green-200',
  medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  high: 'text-red-700 bg-red-50 border-red-200',
};

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

/* ── component ── */
export default function DiagnosePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('input');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [diagnoseError, setDiagnoseError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [submitError, setSubmitError] = useState('');

  /* ── handlers ── */
  const handleFile = (file: File) => {
    if (!ALLOWED.has(file.type)) { setUploadError('صيغة الصورة غير مدعومة (JPG, PNG, WEBP فقط)'); return; }
    if (file.size > MAX_SIZE) { setUploadError('حجم الصورة يتجاوز 5 MB'); return; }
    setUploadError('');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadedUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
    setUploadedUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDiagnose = async () => {
    if (!imageFile && !description.trim()) return;
    setDiagnoseError('');
    setStep('loading');

    let imgUrl = uploadedUrl;

    if (imageFile && !imgUrl) {
      try {
        const fd = new FormData();
        fd.append('files', imageFile);
        const up = await fetch('/api/upload', { method: 'POST', body: fd });
        const upData = await up.json();
        if (!up.ok || !upData.success) throw new Error(upData.error ?? 'فشل رفع الصورة');
        imgUrl = upData.files[0]?.url ?? null;
        setUploadedUrl(imgUrl);
      } catch (e) {
        setDiagnoseError(e instanceof Error ? e.message : 'فشل رفع الصورة');
        setStep('input');
        return;
      }
    }

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imgUrl ?? undefined, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'فشل التشخيص');
      setResult(data.result as DiagnoseResult);
      setStep('result');
    } catch (e) {
      setDiagnoseError(e instanceof Error ? e.message : 'حدث خطأ، حاول مجدداً');
      setStep('input');
    }
  };

  const handleSendQuote = async () => {
    if (!name.trim() || !phone.trim()) { setSubmitError('الاسم ورقم الهاتف مطلوبان'); return; }
    setSubmitError('');

    const aiNotes = result
      ? [
          `[تشخيص AI]`,
          `نوع العطل: ${result.fault.faultType}`,
          `الخطورة: ${SEVERITY_LABEL[result.fault.severity]}`,
          `القطع المتأثرة: ${result.fault.affectedParts.join('، ')}`,
          `الإلحاح: ${result.fault.urgency}`,
          `الإجراء الموصى به: ${result.fault.recommendedAction}`,
          result.part ? `القطعة المُعرَّفة: ${result.part.partNameAr} (${result.part.partNameEn}) — ثقة ${Math.round(result.part.confidence * 100)}%` : '',
        ].filter(Boolean).join('\n')
      : '';

    const body = {
      source: 'quote-form',
      customerName: name.trim(),
      phone: phone.trim(),
      city: city.trim() || null,
      faultDescription: description.trim() || result?.fault.faultType || 'تشخيص ذكي',
      partNameAR: result?.part?.partNameAr ?? null,
      partNameEN: result?.part?.partNameEn ?? null,
      notes: aiNotes,
      symptoms: [],
      images: uploadedUrl
        ? [{ originalName: 'part.jpg', storedName: 'part.jpg', url: uploadedUrl, size: imageFile?.size ?? 0, type: imageFile?.type ?? 'image/jpeg', uploadedAt: new Date().toISOString() }]
        : [],
      nameplateImages: [],
    };

    try {
      const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'فشل إرسال الطلب');
      setStep('sent');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'حدث خطأ، حاول مجدداً');
    }
  };

  /* ── render ── */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" />
            تشخيص ذكي بالذكاء الاصطناعي
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            شخّص عطل جهازك في ثوانٍ
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            ارفع صورة القطعة المعطوبة أو اكتب وصف العطل، وسنحدد المشكلة ونرسل لك عرض سعر فوري.
          </p>
        </div>

        {/* ── STEP: INPUT ── */}
        {(step === 'input' || step === 'loading') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

            {/* Image upload */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">صورة القطعة (اختياري)</p>
              {!preview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">اضغط لرفع صورة أو اسحبها هنا</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — حتى 5 MB</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              ) : (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="صورة القطعة" className="w-full h-full object-cover" />
                  <button onClick={removeImage} className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">وصف العطل</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: الغسالة تعمل لكن لا تخرج الماء، وأسمع صوت طنين من المضخة..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {diagnoseError && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {diagnoseError}
              </div>
            )}

            <button
              onClick={handleDiagnose}
              disabled={step === 'loading' || (!imageFile && !description.trim())}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 rounded-xl transition-colors"
            >
              {step === 'loading' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ التشخيص...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> شخّص العطل الآن</>
              )}
            </button>
          </div>
        )}

        {/* ── STEP: RESULT ── */}
        {step === 'result' && result && (
          <>
            {/* AI Result card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  نتيجة التشخيص
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SEVERITY_COLOR[result.fault.severity]}`}>
                  خطورة {SEVERITY_LABEL[result.fault.severity]}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <Row label="نوع العطل" value={result.fault.faultType} />
                <Row label="الإلحاح" value={result.fault.urgency} />
                <Row label="التكلفة التقديرية" value={`$${result.fault.estimatedCostUsd}`} />
                {result.fault.affectedParts.length > 0 && (
                  <Row label="القطع المتأثرة" value={result.fault.affectedParts.join('، ')} />
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
                <p className="font-semibold mb-1">الإجراء الموصى به:</p>
                <p>{result.fault.recommendedAction}</p>
              </div>

              {result.part && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm space-y-1">
                  <p className="font-semibold text-slate-700">القطعة المُعرَّفة من الصورة:</p>
                  <p className="text-slate-900">{result.part.partNameAr} <span className="text-slate-500">({result.part.partNameEn})</span></p>
                  <p className="text-slate-500">الثقة: {Math.round(result.part.confidence * 100)}%</p>
                  {result.part.compatibleBrands.length > 0 && (
                    <p className="text-slate-500">متوافق مع: {result.part.compatibleBrands.join('، ')}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep('input')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                تشخيص جديد
              </button>
            </div>

            {/* Quote form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-600" />
                أرسل طلب عرض السعر
              </h2>
              <p className="text-xs text-slate-500">سنتواصل معك خلال ساعات بعرض سعر مفصّل بناءً على التشخيص.</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">الاسم *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">رقم الهاتف *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+968 XXXX XXXX" type="tel" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">المدينة</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مسقط، صلالة، ..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              {submitError && (
                <p className="text-xs text-red-600">{submitError}</p>
              )}

              <button
                onClick={handleSendQuote}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-3.5 rounded-xl transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                أرسل طلب العرض
              </button>
            </div>
          </>
        )}

        {/* ── STEP: SENT ── */}
        {step === 'sent' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">تم إرسال طلبك!</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              استلمنا طلبك مع نتيجة التشخيص. سنتواصل معك في أقرب وقت بعرض سعر مفصّل.
            </p>
            <button
              onClick={() => { setStep('input'); setResult(null); setDescription(''); removeImage(); setName(''); setPhone(''); setCity(''); }}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
            >
              <ChevronLeft className="w-4 h-4" />
              تشخيص جهاز آخر
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 shrink-0 min-w-[110px]">{label}:</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
