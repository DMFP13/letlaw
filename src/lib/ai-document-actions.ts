"use server";

import Anthropic from "@anthropic-ai/sdk";
import { type DocType } from "./document-types";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function generateAiClauses(
  docType: DocType,
  tenancyContext: string,
  customRequirements: string
): Promise<{ clauses: string; error?: string }> {
  if (!client) {
    return {
      clauses: "",
      error: "AI clause generation requires an ANTHROPIC_API_KEY environment variable.",
    };
  }

  const systemPrompts: Record<DocType, string> = {
    "rra-info-sheet": `You are a specialist UK landlord law adviser. Generate additional clauses or notes for an RRA Information Sheet based on the landlord's specific circumstances. Use plain English. Format as bullet points. Focus only on what is legally relevant and practically useful. Do not include standard rights already covered by the template — only add what is specific to this tenancy.`,
    "tenancy-terms": `You are a specialist UK landlord law adviser. Draft additional tenancy clauses for an assured tenancy agreement under English law. These will be appended to a standard written statement of terms. Use formal but clear language. Number each clause. Ensure they are legally sound under the Renters' Rights Act 2025 and relevant housing legislation. Do not repeat standard terms.`,
    "section-13": `You are a specialist UK landlord law adviser. Draft a covering letter to accompany a Section 13 rent increase notice. Keep it professional, factual, and concise. Acknowledge the tenant's right to challenge at the First-tier Tribunal if they dispute the proposed rent. Do not include legal threats or aggressive language.`,
    "right-to-rent": `You are a specialist UK landlord law adviser. Generate additional notes for a Right-to-Rent check record based on the specific circumstances described. Include guidance on follow-up actions required, any time-limited permissions, and document retention requirements under the Immigration Act 2014.`,
  };

  const prompt = `Tenancy context:
${tenancyContext}

Landlord's specific requirements / circumstances:
${customRequirements}

Generate appropriate additional content for the ${docType} document.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      system: systemPrompts[docType],
    });

    const text = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("\n");

    return { clauses: text };
  } catch (err: any) {
    return { clauses: "", error: `AI generation failed: ${err.message}` };
  }
}
