# خارطة الطريق — تحويل Laundry Parts Hub إلى منصة AI متكاملة

> هذه الخارطة مستخلصة من خطة الـ 24 أسبوع المرفقة في الـ PDF،
> مع تعديل واقعي حسب الحالة الحالية للـ codebase والميزانية الفعلية لمطور واحد.

## رؤية المنتج

منصة B2B في الخليج تربط الفنيين وأصحاب المغاسل بقطع الغيار، مع وكلاء AI:

1. **Vision Agent** — يتعرّف على القطعة من صورة.
2. **Support Agent** — يفهم استفسار العميل ويولّد عرض سعر تلقائياً.
3. **Sourcing/Supplier Intelligence** — يقيّم الموردين ويتنبأ بسلوكهم.
4. **Negotiation Engine** — يتفاوض مع الموردين (مرحلة متقدمة).

---

## الحالة الحالية (T0)

| الفئة | الحالة |
|------|------|
| Schema (Drizzle, MySQL, 13 جدولاً) | ✅ موجود |
| Auth (cookie-based admin + tRPC RBAC) | ✅ موجود |
| Quote request flow | ✅ موجود |
| Image upload (local) | ⚠️ موجود لكن file-system فقط |
| **Vision Agent (هذه الـ PR)** | ✅ MVP عبر `invokeLLM` |
| Support / Negotiation / Sourcing agents | ⏳ غير مُنفّذ |
| Payments / Marketplace | ⏳ غير مُنفّذ |
| Mobile App | ⏳ غير مُنفّذ |

---

## المرحلة 1 — تثبيت الأساس (الأسابيع 1-2)

**الهدف:** نظافة الـ codebase وجاهزية الـ deploy.

- [x] إصلاح ازدواجية العملة (إضافة `costCurrency` و `sellingCurrency`).
- [x] استخدام `adminProcedure` بدل التحقق اليدوي في كل mutation.
- [x] تشديد Zod (email/url/decimals/enums بدل `z.any`).
- [x] توثيق متغيرات البيئة (`.env.local.example` + README).
- [ ] استبدال الرفع المحلي بـ Azure Blob / S3 (المخزن الحالي ephemeral).
- [ ] نقل البذر (`data/parts.ts`) إلى migration / seed script.
- [ ] إضافة CI: `npm run lint`, `tsc --noEmit`, اختبارات.

**KPI:** أي PR يمر بـ lint+typecheck؛ صفر `z.any` في routers الإنتاجية.

---

## المرحلة 2 — Vision + Support Agents (الأسابيع 3-8)

**الهدف:** تحويل الـ MVP الحالي للـ Vision Agent إلى ميزة جاهزة للعميل.

### 2.1 Vision Agent (الأسبوع 3-4)

- [x] `server/agents/visionAgent.ts` (`identifyPart`, `analyzeFault`).
- [x] `server/agents/visionRouter.ts` (tRPC، caching, audit log).
- [x] صفحة `/admin/vision` لاختبار يدوي.
- [ ] ربط نتيجة `identifyPart` بمنتجات `products` (matching بـ embedding أو fuzzy).
- [ ] جمع 50+ صورة موسومة لقياس دقة الـ Vision في بيئة حقيقية.
- [ ] عتبة ثقة أدنى (`<0.6`): تمرير للمراجعة البشرية.

**KPI:** ≥ 70% دقة على مجموعة اختبار من 100 صورة.

### 2.2 Customer Support Agent (الأسبوع 5-7)

- [ ] `server/agents/supportAgent.ts` يستدعي `visionAgent.analyzeFault` ثم يقترح قطع.
- [ ] محرك مطابقة قطع بسيط (SKU/keyword/synonym list) قبل أي تطور لـ vector search.
- [ ] توليد عرض سعر تلقائي من الإقتراحات.
- [ ] واجهة Chat بسيطة في `/app/support` للعملاء.
- [ ] قناة WhatsApp عبر Twilio / Meta Cloud API (read-only في البداية).

**KPI:** ≥ 50% من الاستفسارات تُحَل دون تدخل بشري في بيئة الاختبار.

### 2.3 إصلاحات DX (الأسبوع 8)

- [ ] حسم البنية: Next.js app routes فقط، أو Express + Vite. الازدواجية الحالية مربكة.
- [ ] حذف `data/parts.ts` بعد الـ seed، أو استخدامه فقط في dev.
- [ ] اختبارات E2E لتدفق العميل: رفع صورة → تحليل → عرض سعر.

---

## المرحلة 3 — Supplier Intelligence (الأسابيع 9-14)

**الهدف:** الاستفادة من البيانات المتراكمة لتقييم الموردين.

- [ ] جمع تلقائي للـ KPIs من `pricingHistory`, `orders`, `communicationLog`:
  - متوسط زمن الرد، نسبة التسليم في الموعد، تذبذب السعر، نسبة المرتجعات.
- [ ] `server/agents/supplierIntelligence.ts`:
  - `analyzeSupplierBehavior(supplierId)` — حساب reliabilityScore تلقائياً.
  - `rankSuppliers(productId, criteria)` — ترتيب موزون.
- [ ] لوحة تحكم Suppliers مع رسوم بيانية (recharts موجود بالفعل).
- [ ] تنبيه Slack/Email عند انخفاض الأداء.

> ⚠️ **تجنّب** Vector DB / Data Warehouse في هذه المرحلة. SQL aggregations كافية حتى ≥ 100K صف.

**KPI:** نموذج reliabilityScore متّسق مع تقييم بشري (Spearman > 0.7).

---

## المرحلة 4 — Marketplace أساسي (الأسابيع 15-20)

**الهدف:** تحويل المنصة من "كتالوج" إلى "سوق".

- [ ] Stripe payments (intents + webhooks). يلزم تسجيل تجاري في عُمان أو دبي أولاً.
- [ ] Supplier portal (login منفصل، إدارة كتالوج خاص بهم).
- [ ] نظام تتبع الطلبات (status timeline).
- [ ] فواتير PDF (puppeteer + قوالب).
- [ ] Disputes resolution مبسّط (نموذج فتح نزاع + workflow بشري).

> ⚠️ **مخاطر قانونية**: قبل تشغيل المدفوعات، يلزم سجل تجاري + ضريبة قيمة مضافة + اتفاقية Stripe.

**KPI:** أول طلب مدفوع real-time من خلال المنصة.

---

## المرحلة 5 — Negotiation Engine (الأسابيع 21-24+)

**الهدف:** وكيل تفاوض شبه آلي (Human-in-the-Loop).

- [ ] `server/agents/negotiationEngine.ts`:
  - `initiateNegotiation`: عرض أولي بناءً على supplier profile + target price.
  - `processSupplierResponse`: قبول/رفض/عرض مضاد.
- [ ] **كل قرار يُعرض على الإدارة قبل الإرسال** في الإصدار الأول.
- [ ] قياس: هامش الربح المُحقق مقابل ما كان يدوياً.

> ⚠️ **تحذير**: التفاوض الآلي يحمل مخاطر علاقات تجارية. لا تُفعّله auto-mode إلا بعد 6 أشهر من القياس.

---

## ما لن نفعله (Anti-roadmap)

| البند في الـ PDF | السبب |
|------|------|
| React Native App | overkill قبل 1,000 مستخدم نشط. الويب الـ responsive كافٍ. |
| Vector Database (Pinecone/Weaviate) | لا حاجة قبل ≥ 50K صورة + recall محسوس. |
| Data Warehouse (ClickHouse) | MySQL + materialized views يكفي حتى مليون صف. |
| Fine-tuning نماذج خاصة | بـ Claude API الدقة عالية بدون تدريب. |
| Custom Transformer / CNN | ليس من جوهر القيمة المضافة. |

---

## مؤشرات النجاح بعد 6 أشهر

- ≥ 100 مستخدم نشط شهرياً (ليس 500 كما في الـ PDF).
- ≥ 50 طلباً مكتملاً.
- ≥ 20 مورداً.
- ≥ 1,000 صورة موسومة.
- إيرادات شهرية: $2,000–5,000 (واقعياً، ليس $100K كما في الـ PDF).

---

## مخاطر يجب رصدها

1. **التوافر القانوني للمدفوعات** — اعرف اللوائح قبل المرحلة 4.
2. **اعتماد على بوابة LLM وحيدة** — أَضِف fallback (OpenAI / Gemini مباشرة).
3. **ثبات قناة WhatsApp** — Meta API صارمة في B2B.
4. **حماية البيانات** — صور القطع قد تحوي أرقام تسلسلية / علامات تجارية.

---

## الخطوة التالية الفورية

1. مراجعة هذه الـ PR ودمجها.
2. تشغيل migration `0002_currency_columns.sql` على بيئة الـ staging.
3. توفير `BUILT_IN_FORGE_API_KEY` في الـ env واختبار صفحة `/admin/vision` بصورة حقيقية.
4. جمع 20 صورة قطعة لقياس الدقة الأولية.
