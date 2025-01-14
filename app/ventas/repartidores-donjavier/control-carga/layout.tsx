export default function RepartidoresDonjavierLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
        <main className="flex flex-col gap-4 mx-auto w-full md:flex-row">
                {children}
        </main>

    );
  }
  