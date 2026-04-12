import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="hero-content text-center flex flex-col gap-6 max-w-lg">
        <h1 className="text-5xl font-bold">Hike Explorer</h1>
        <p className="text-base-content/60 text-lg">
          Upload your GPX files and explore your trails.
        </p>
        <Link href="/test" className="btn btn-primary btn-lg">
          Get Started
        </Link>
      </div>
    </main>
  );
}
