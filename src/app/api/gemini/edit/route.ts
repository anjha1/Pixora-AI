import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to extract Base64 data from text that may contain JSON in markdown
function extractBase64FromText(text: string): string | null {
  // First, try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1]);
      // Look for base64 data in common fields
      const possibleFields = ['text', 'image', 'data', 'base64'];
      for (const field of possibleFields) {
        if (json[field] && typeof json[field] === 'string') {
          const content = json[field];
          if (content.startsWith('data:image/')) {
            return content.split(',')[1] || null;
          } else if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length > 100) {
            // Assume it's raw base64
            return content;
          }
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Fallback: check if the text itself is a data URL
  if (text.startsWith("data:image/")) {
    return text.split(',')[1] || null;
  }

  // Check if the entire text is base64
  if (/^[A-Za-z0-9+/=]+$/.test(text.trim()) && text.trim().length > 100) {
    return text.trim();
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, prompt } = await request.json();

    if (!imageData || !prompt) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Use the current stable multimodal model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // The imageData should already be split on the client, but adding a safe split here.
    const base64Data = imageData.split(',').length > 1 ? imageData.split(',')[1] : imageData;
    const mimeType = imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    // Convert base64 image data to parts
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ];

    // Strong prompt instructing the model to return ONLY the image
    const enhancedPrompt = `Using the attached image as inspiration, GENERATE A NEW, complete image. In this new image, apply the following visual change: ${prompt}. The output MUST be a single, finished image, and nothing else.`;

    const result = await model.generateContent([enhancedPrompt, ...imageParts], {
      // CORRECTED: 600000ms is 10 minutes. 60000ms is 60 seconds.
      timeout: 60000 // 60 seconds
    });

    const response = result.response;
    console.log("Gemini response:", JSON.stringify(response, null, 2));

    // Find the generated image in the response
    const candidates = response.candidates;

    // 1. Check if ANY candidates were returned (i.e., not blocked by safety filters)
    if (!candidates || candidates.length === 0) {
      // ADDED: Check for promptFeedback which indicates a safety block
      const promptFeedback = response.promptFeedback;
      if (promptFeedback && promptFeedback.blockReason) {
        console.error("Generation blocked by safety filters:", promptFeedback.blockReason);
        throw new Error(`Generation failed: Model output was blocked. Reason: ${promptFeedback.blockReason}`);
      }
      throw new Error("Generation failed: Model output was empty.");
    }

    const content = candidates[0].content;
    const parts = content.parts;

    // 2. Check if the candidate content has parts
    if (!parts || parts.length === 0) {
      console.log("No parts found. Full response:", JSON.stringify(response, null, 2));
      throw new Error("Generation failed: Candidate parts array is empty. The model may have generated text instead of an image.");
    }

    // 3. First, check if the model returned an image part (inlineData) directly (PREFERRED)
    const imagePart = parts.find((part: any) => part.inlineData);

    if (imagePart && imagePart.inlineData) {
        // SUCCESS: The model returned a dedicated image part (preferred path)
        const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        return NextResponse.json({
            success: true,
            editedImage: base64Image,
        });
    }

    // 4. If no dedicated image part was found, check for Base64 data inside a text part (FALLBACK)
    const textPart = parts.find((part: any) => part.text);

    if (textPart && textPart.text) {
        const textContent = textPart.text.trim();

        // Use the helper function to extract Base64 data
        const extractedBase64 = extractBase64FromText(textContent);

        if (extractedBase64 && extractedBase64.length > 100) { // Check length to ensure it's not a tiny string
            // SUCCESS: Found and extracted Base64 data from the text part
            const base64Image = `data:image/jpeg;base64,${extractedBase64}`;
            return NextResponse.json({
                success: true,
                editedImage: base64Image,
                // ADDED: A message to note that the fallback method was used
                _message: "Warning: Model returned image as text. Consider refining prompt."
            });
        }

        // If the text part exists but no Base64 data was extracted, throw the original error
        throw new Error(`Model generated text instead of image: "${textContent.substring(0, 100)}...". Please adjust the prompt.`);
    }

    // 5. Fallback if absolutely nothing was found
    throw new Error("No usable output (image or text) found in the model response. Try making the prompt simpler or shorter.");

  } catch (error) {
    console.error("Gemini API error:", error);
    // IMPROVED: Send the specific error message back to the client for easier debugging
    const errorMessage = error instanceof Error ? error.message : "Failed to process image";
    return NextResponse.json(
      { error: "Failed to process image with Gemini", details: errorMessage },
      { status: 500 }
    );
  }
}