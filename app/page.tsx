import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Your hikes,{" "}
            <span className="text-primary">beautifully visualized.</span>
          </h1>
          <p className="text-base-content/60 text-lg leading-relaxed">
            Drop a GPX file. Get stunning stats, elevation profiles, and
            shareable infographics — instantly.
          </p>
        </div>

        <Link href="/test" className="btn btn-primary btn-lg px-10">
          Generate Your First Graphic →
        </Link>
      </div>
    </main>
  );
}
