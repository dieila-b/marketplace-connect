import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messages — Kafoo" }] }),
});

type Conv = {
  id: string; last_message: string | null; last_message_at: string | null;
  buyer_id: string; seller_id: string;
  listing: { id: string; slug: string; title: string } | null;
};
type Msg = { id: string; content: string; sender_id: string; created_at: string };

function MessagesPage() {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("conversations")
      .select(`id,last_message,last_message_at,buyer_id,seller_id, listing:listings(id,slug,title)`)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false })
      .then(({ data }) => setConvs((data ?? []) as unknown as Conv[]));
  }, [supabase, user]);

  useEffect(() => {
    if (!active) return;
    void supabase.from("messages").select("id,content,sender_id,created_at")
      .eq("conversation_id", active.id).order("created_at")
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [supabase, active]);

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    const receiver = active.buyer_id === user.id ? active.seller_id : active.buyer_id;
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: active.id, sender_id: user.id, receiver_id: receiver, content: text,
    }).select("id,content,sender_id,created_at").maybeSingle();
    if (!error && data) {
      setMsgs((m) => [...m, data as Msg]); setText("");
      await supabase.from("conversations").update({ last_message: text, last_message_at: new Date().toISOString() }).eq("id", active.id);
    }
  };

  if (!user) return null;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Messages</h1>
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <aside className="rounded-lg border bg-card">
          {convs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>
          ) : (
            <ul className="divide-y">
              {convs.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setActive(c)} className={"block w-full p-3 text-left hover:bg-accent " + (active?.id === c.id ? "bg-accent" : "")}>
                    <p className="truncate text-sm font-medium">{c.listing?.title ?? "Annonce"}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.last_message ?? "—"}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className="flex min-h-[400px] flex-col rounded-lg border bg-card">
          {!active ? (
            <p className="m-auto text-sm text-muted-foreground">Sélectionnez une conversation</p>
          ) : (
            <>
              <header className="border-b p-3 text-sm">
                {active.listing && <Link to="/annonces/$slug" params={{ slug: active.listing.slug }} className="font-medium hover:underline">{active.listing.title}</Link>}
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {msgs.map((m) => (
                  <div key={m.id} className={"max-w-[75%] rounded-lg px-3 py-2 text-sm " + (m.sender_id === user.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t p-3">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send}>Envoyer</Button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
