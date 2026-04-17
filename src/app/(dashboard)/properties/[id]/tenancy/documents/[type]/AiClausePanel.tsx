"use client";

import { useState } from "react";
import { generateAiClauses } from "@/lib/ai-document-actions";
import { type DocType } from "@/lib/document-types";

export function AiClausePanel({
  docType,
  tenancyContext,
  hasApiKey,
}: {
  docType: DocType;
  tenancyContext: string;
  hasApiKey: boolean;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const placeholders: Record<DocType, string> = {
    "rra-info-sheet": 'e.g. "Tenant has a right to keep one cat. Parking space included in the rent. Garden shared with other flat."',
    "tenancy-terms": 'e.g. "Tenant may keep one dog with insurance. Landlord will maintain the garden. No smoking anywhere in the property."',
    "section-13": 'e.g. "Rent hasn\'t increased for 3 years. Local market rents have risen 12%. I want a friendly covering letter."',
    "right-to-rent": 'e.g. "Tenant is on a student visa expiring June 2026. I need reminders about when to re-check."',
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await generateAiClauses(docType, tenancyContext, input);
      if (res.error) setError(res.error);
      else setResult(res.clauses);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          ✨ AI Clause Generator
        </p>
        <p className="text-indigo-200 text-xs mt-0.5">
          Describe your specific circumstances — Claude will draft the right clauses.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {!hasApiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>API key not configured.</strong> Add <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your environment variables to enable AI generation.
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[docType]}
          rows={5}
          disabled={!hasApiKey}
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
        />

        <button
          onClick={handleGenerate}
          disabled={!hasApiKey || loading || !input.trim()}
          className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span> Generating…
            </>
          ) : (
            <>✨ Generate clauses</>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">Generated clauses</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {result}
            </div>
            <p className="text-xs text-gray-400">
              Review carefully before adding to the document. AI output is not legal advice.
            </p>
          </div>
        )}

        {!result && !error && (
          <div className="text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-500">What this does:</p>
            <ul className="space-y-0.5">
              <li>• Drafts clauses specific to your circumstances</li>
              <li>• Uses knowledge of RRA 2025 & housing law</li>
              <li>• Copy clauses into the document below your signature</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
