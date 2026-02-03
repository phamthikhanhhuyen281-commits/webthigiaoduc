
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Chat với trợ lý AI
 */
export const chatWithAI = async (history: {role: string, parts: {text: string}[]}[], message: string, context: any) => {
  const systemInstruction = `Bạn là Trợ lý Giáo dục EduExam AI. 
  Hãy trả lời ngắn gọn, sư phạm và khuyến khích học sinh. 
  Ngữ cảnh: Người dùng đang ở trang ${context.view}.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction }
    });
    return response.text || "Mình có thể giúp gì thêm cho bạn?";
  } catch (error) {
    console.error("Chat error:", error);
    return "Hệ thống đang bận hoặc quá tải, bạn vui lòng thử lại sau nhé!";
  }
};

/**
 * Số hóa đề thi từ Ảnh/PDF
 */
export const createExamFromFile = async (base64Data: string, mimeType: string) => {
  const systemInstruction = `Bạn là chuyên gia số hóa đề thi chuyên nghiệp. 
  Nhiệm vụ: Phân tích tệp (Ảnh/PDF) và trích xuất thành JSON đề thi trắc nghiệm.
  - Phải có title, subject, duration (phút).
  - questions: mảng các câu hỏi trắc nghiệm (text, options mảng 4 chuỗi, correctAnswer 0-3, explanation).
  - CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT GIẢI THÍCH.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Phân tích và trích xuất đề thi này sang định dạng JSON trắc nghiệm." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "text", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "subject", "duration", "questions"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI không trả về dữ liệu.");
    
    // Làm sạch JSON trong trường hợp AI vẫn trả về backticks
    const cleanedJson = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error: any) {
    console.error("Gemini Scanning Error Details:", error);
    throw new Error(error.message || "Lỗi quét đề thi. Vui lòng chụp ảnh rõ nét hơn và thử lại.");
  }
};
