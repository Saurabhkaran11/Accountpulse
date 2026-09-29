import { Suspense } from "react";
import { AskChat } from "./AskChat";

export const metadata = { title: "Ask AccountPulse" };

// Suspense is required because the chat reads ?q= from the URL
// (search results send questions here).
export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskChat />
    </Suspense>
  );
}
