export default function RepartidoresDonjavierLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="flex flex-col h-screen md:flex-row">
      
  
  
        <main className="w-[95%] mx-auto flex flex-col md:flex-row gap-4 p-4">
                {children}
              </main>
      </section>
    );
  }
  