import { invokeLLM, type Message } from "../_core/llm";

export type IdentifiedPart = {
  partNameAr: string;
  partNameEn: string;
  confidence: number;
  compatibleBrands: string[];
  possibleIssues: string[];
  recommendedParts: string[];
  notes: string;
};

export type FaultAnalysis = {
  faultType: string;
  severity: "low" | "medium" | "high";
  affectedParts: string[];
  estimatedCostUsd: number;
  urgency: string;
  recommendedAction: string;
};

const VISION_OUTPUT_SCHEMA = {
  name: "identified_part",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "partNameAr",
      "partNameEn",
      "confidence",
      "compatibleBrands",
      "possibleIssues",
      "recommendedParts",
      "notes",
    ],
    properties: {
      partNameAr: { type: "string" },
      partNameEn: { type: "string" },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      compatibleBrands: { type: "array", items: { type: "string" } },
      possibleIssues: { type: "array", items: { type: "string" } },
      recommendedParts: { type: "array", items: { type: "string" } },
      notes: { type: "string" },
    },
  },
} as const;

const FAULT_OUTPUT_SCHEMA = {
  name: "fault_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "faultType",
      "severity",
      "affectedParts",
      "estimatedCostUsd",
      "urgency",
      "recommendedAction",
    ],
    properties: {
      faultType: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high"] },
      affectedParts: { type: "array", items: { type: "string" } },
      estimatedCostUsd: { type: "number", minimum: 0 },
      urgency: { type: "string" },
      recommendedAction: { type: "string" },
    },
  },
} as const;

const IDENTIFY_PROMPT = `أنت خبير في قطع غيار المغاسل الصناعية. حلل الصورة المرفقة وحدد:
1. اسم القطعة بالعربية والإنجليزية
2. درجة الثقة من 0 إلى 1
3. الماركات المتوافقة (Electrolux, Speed Queen, Miele, ...)
4. الأعطال المحتملة المرتبطة بهذه القطعة
5. القطع البديلة الموصى بها
6. ملاحظات إضافية للفني

أَرجِع JSON مطابقاً للـ schema بالضبط بدون أي نص خارجي.`;

const buildFaultPrompt = (description: string, partContext?: IdentifiedPart) => `
أنت خبير في تشخيص أعطال المغاسل الصناعية.

وصف العميل: "${description}"
${partContext ? `تحليل الصورة: ${JSON.stringify(partContext)}` : ""}

حدد:
1. نوع العطل
2. درجة الخطورة (low/medium/high)
3. القطع المتأثرة
4. تقدير التكلفة بالدولار الأمريكي
5. مدى الإلحاح
6. الإجراء الموصى به

أَرجِع JSON مطابقاً للـ schema بدون أي نص خارجي.`.trim();

const parseJsonContent = (raw: string | object): unknown => {
  if (typeof raw !== "string") return raw;

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("LLM returned empty response");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM response was not valid JSON");
    }
    return JSON.parse(match[0]);
  }
};

const extractMessageContent = (
  result: Awaited<ReturnType<typeof invokeLLM>>
): string => {
  const message = result.choices?.[0]?.message;
  if (!message) {
    throw new Error("LLM response had no choices");
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();
};

export async function identifyPart(imageUrl: string): Promise<IdentifiedPart> {
  const messages: Message[] = [
    {
      role: "user",
      content: [
        { type: "text", text: IDENTIFY_PROMPT },
        { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
      ],
    },
  ];

  const result = await invokeLLM({
    messages,
    maxTokens: 1024,
    outputSchema: VISION_OUTPUT_SCHEMA,
  });

  const parsed = parseJsonContent(extractMessageContent(result)) as IdentifiedPart;
  return parsed;
}

export async function analyzeFault(
  description: string,
  imageUrl?: string
): Promise<FaultAnalysis> {
  let partContext: IdentifiedPart | undefined;
  if (imageUrl) {
    try {
      partContext = await identifyPart(imageUrl);
    } catch (error) {
      console.warn("[VisionAgent] identifyPart failed:", error);
    }
  }

  const messages: Message[] = [
    {
      role: "user",
      content: buildFaultPrompt(description, partContext),
    },
  ];

  const result = await invokeLLM({
    messages,
    maxTokens: 768,
    outputSchema: FAULT_OUTPUT_SCHEMA,
  });

  return parseJsonContent(extractMessageContent(result)) as FaultAnalysis;
}
