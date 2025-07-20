export default function IntellipulseChatIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {children}
    </div>
  );
}