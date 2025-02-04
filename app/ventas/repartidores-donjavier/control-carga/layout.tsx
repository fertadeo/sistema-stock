export default function ControlCargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex  ">
     
    
      <main className="flex flex-col  p-4 w-screen translate-x-[-20%]">
              {children}
            </main>
    </section>
  );
}
