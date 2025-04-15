export default function VentasDonjavierLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="flex">
       
  
        <main className="flex flex-col  p-4 w-screen translate-x-[-10%]">
                {children}
              </main>
      </section>
    );
  }
  