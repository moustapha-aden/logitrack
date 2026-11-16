"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { actions } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";
import type { MessageRole, MissionMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

const ROLE_LABEL: Record<MessageRole, string> = { exploitation: "Exploitation", transporteur: "Transporteur", chauffeur: "Chauffeur" };

/** Fil d'échanges rattaché à une mission : l'historique ne reste plus dans les téléphones. */
export function MissionThread({ missionId, messages, author, role, disabledReason }: { missionId: string; messages: MissionMessage[]; author: string; role: MessageRole; disabledReason?: string }) {
  const [text, setText] = useState("");
  const list = messages.filter((m) => m.missionId === missionId).sort((a, b) => a.at.localeCompare(b.at));
  const send = () => {
    if (!text.trim()) return;
    actions.postMessage(missionId, author, role, text);
    setText("");
  };

  return (
    <div>
      <ul className="scroll-thin max-h-72 space-y-2 overflow-y-auto">
        {list.map((m) => {
          const mine = m.role === role;
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3 py-2", mine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-ink")}>
                <p className={cn("text-[11px] font-medium", mine ? "text-white/70" : "text-slate-500")}>
                  {m.author} · {ROLE_LABEL[m.role]}
                </p>
                <p className="text-sm whitespace-pre-line">{m.text}</p>
                <p className={cn("mt-0.5 text-right text-[10px] tabular-nums", mine ? "text-white/60" : "text-slate-400")}>{formatDateTime(m.at)}</p>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="py-4 text-center text-sm text-slate-500">Aucun message sur cette mission.</li>}
      </ul>
      {disabledReason ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{disabledReason}</p>
      ) : (
        <div className="mt-3 flex items-end gap-2">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
            }}
            placeholder="Écrire un message… (Ctrl + Entrée pour envoyer)"
            aria-label="Message"
          />
          <Button icon={Send} onClick={send} disabled={!text.trim()} aria-label="Envoyer">
            Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}
