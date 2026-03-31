import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, backgroundBase64, format, quality } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64) throw new Error("imageBase64 is required");
    if (!backgroundBase64) throw new Error("backgroundBase64 is required");

    const formatMap: Record<string, string> = {
      "1:1": "square 1:1 aspect ratio",
      "3:4": "3:4 portrait aspect ratio (Instagram feed)",
      "9:16": "9:16 vertical aspect ratio (Instagram Stories/Reels)",
    };
    const qualityMap: Record<string, string> = {
      "2k": "2048px on the longest side, high resolution",
      "4k": "4096px on the longest side, ultra high resolution",
    };

    const formatDesc = formatMap[format] || formatMap["1:1"];
    const qualityDesc = qualityMap[quality] || qualityMap["2k"];

    const prompt = `You are given two images:
- Image 1: A photo of a car (the subject)
- Image 2: A background scene

Your task:
1. Extract ONLY the car from Image 1. Preserve the car's EXACT original colors, details, badges, reflections, proportions, and shape with pixel-perfect accuracy. Do NOT change the car's color, model, or any visual detail.
2. Place the extracted car naturally into the EXACT background shown in Image 2. The final background must look identical to Image 2 - same room, same lighting, same textures, same perspective. Do NOT generate a different or similar background - use the EXACT scene from Image 2.
3. Match the car's lighting, shadows and reflections to be consistent with the lighting in the background image.
4. Add realistic ground shadow and reflections beneath the car appropriate for the floor surface shown in the background.
5. The car should be centered and properly scaled within the scene.
6. Output in ${formatDesc} at ${qualityDesc}.

IMPORTANT ABOUT FORMAT/CROPPING:
- Do NOT stretch or deform the background image to fit the aspect ratio.
- Instead, CROP the background to the required aspect ratio, keeping the most relevant central area visible.
- For vertical formats (3:4, 9:16), crop the sides of the background and you may slightly zoom in or adjust the car position to fill the frame naturally.
- For square format (1:1), crop equally from sides or top/bottom as needed.
- The background must always look natural and undistorted, as if it were a real photo taken in that aspect ratio.

CRITICAL: The car must keep its REAL original appearance. The background must be EXACTLY the one provided in Image 2, not an interpretation or similar scene. Never stretch or deform the background.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "image_url",
                image_url: { url: backgroundBase64 },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no processamento da imagem." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!resultImage) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      return new Response(JSON.stringify({ error: "A IA não retornou uma imagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: resultImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("studio-ia-process error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
