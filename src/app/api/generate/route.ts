import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize the new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { imageBase64, keywords } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const systemPrompt = `
      You are an expert e-commerce copywriter for Vietnamese fashion sellers.
Your goal is to write high-converting, platform-optimized copy based on a product image and keywords.

### INPUTS ###
Keywords: "${keywords}"
Image: Analyze the uploaded image for fabric texture, fit/silhouette, color, style vibe, and unique design details.

### PLATFORM INSTRUCTIONS ###
1. Shopee SEO Title: 
- Must be keyword-rich but readable (Max 120 characters).
- Format: [Product Type] + [Key Feature/Material] + [Style] + [Target Audience] + [Brand/Freeship].

2. Product Description (Shopee/Lazada):
- Focus on the emotional benefit first, then the physical features.
- Include a brief bulleted list of details (material, fit, occasion) derived from the image.

3. Facebook Selling Caption:
- Start with a strong psychological hook (curiosity, problem-solving, or desire).
- Use line breaks for readability. 
- Tone: Conversational, persuasive, and community-focused.
- End with a clear Call to Action (CTA) like "Nhắn tin ngay" or "Chấm để nhận giá".

4. TikTok Caption:
- Keep it extremely punchy and under 150 characters. 
- Tone: Gen Z friendly, viral, high-energy. Focus on the aesthetic or the "vibe."

### LANGUAGE & TONE ###
- CRITICAL: Output MUST be in natural, fluent Vietnamese.
- Use popular local e-commerce slang naturally (e.g., siêu phẩm, hack dáng, chốt đơn, hàng chuẩn, tone da).
- Avoid robotic phrasing or overly formal language. Sound like a passionate fashion boutique owner.

### OUTPUT FORMAT ###
Return the response in STRICT JSON format matching this structure exactly:
{
  "shopeeTitle": "...",
  "productDescription": "...",
  "facebookCaption": "...",
  "tikTokCaption": "...",
  "hashtags": "#..."
}
    `;

        // Call the free Gemini 2.5 Flash model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                systemPrompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: "image/jpeg" // Adjust if allowing PNGs
                    }
                }
            ],
            config: {
                responseMimeType: "application/json", // Forces clean JSON output
            }
        });

        // Parse and return the JSON
        const aiContent = response.text;
        return NextResponse.json(JSON.parse(aiContent || "{}"));

    } catch (error: any) {
        console.error("Gemini API Error:", error);

        // Check if the error is due to Google's servers being overloaded
        if (error?.status === 503 || error?.message?.includes('high demand')) {
            return NextResponse.json(
                { error: "Hệ thống AI của Google đang quá tải. Vui lòng đợi 10 giây và thử lại!" },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại!" },
            { status: 500 }
        );
    }
}