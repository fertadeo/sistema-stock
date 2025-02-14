export default function RevendedoresLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="flex flex-col w-screen h-screen md:flex-row">
        <aside className="w-full h-full bg-gray-100 md:w-1/6"> </aside>
  
  
        <main className="w-[60%] mx-auto flex flex-col md:flex-row gap-4 p-4">
                {children}
              </main>
      </section>
    );
  }
  