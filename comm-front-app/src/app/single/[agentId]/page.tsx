import SingleInterface from "@/src/components/SingleInterface";
export default async function SinglePage({ params }: { params: Promise<{ agentId: string }> }) {
  const resolvedParams = await params;
  const agentId = resolvedParams.agentId;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <SingleInterface agentId={agentId} />
    </main>
  );
}