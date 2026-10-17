// src/app/tutorials/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import AgentPlayground from "@/components/AgentPlayground";
import { TUTORIALS, getTutorialBySlug } from "@/data/tutorials";
import { BookOpen, Layers, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  return TUTORIALS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lesson = getTutorialBySlug(resolvedParams.slug);
  if (!lesson) return { title: "Tutorial Not Found" };

  return {
    title: `${lesson.title} | AI Engineering Playground`,
    description: lesson.seoDescription,
  };
}

// Sidebar component that uses the slug
function SidebarNav({ currentSlug }: { currentSlug: string }) {
  const modules = Array.from(new Set(TUTORIALS.map((t) => t.module)));

  return (
    <aside className="md:col-span-3 border-r border-slate-800/80 p-5 space-y-6 bg-slate-950">
      {modules.map((modName) => (
        <div key={modName}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            {modName}
          </h3>
          <ul className="space-y-1.5">
            {TUTORIALS.filter((t) => t.module === modName).map((item) => {
              const isActive = item.slug === currentSlug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/tutorials/${item.slug}`}
                    className={`block rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

// Lesson content component that awaits and loads the lesson
async function LessonContainer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getTutorialBySlug(slug);
  if (!lesson) notFound();

  const currentIndex = TUTORIALS.findIndex((t) => t.slug === slug);
  const prevLesson = currentIndex > 0 ? TUTORIALS[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < TUTORIALS.length - 1 ? TUTORIALS[currentIndex + 1] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 flex-1 max-w-7xl w-full mx-auto">
      <Suspense fallback={<div className="p-5 text-xs text-slate-500">Loading sidebar...</div>}>
        <SidebarNav currentSlug={slug} />
      </Suspense>

      <main className="md:col-span-9 p-6 md:p-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
          <Sparkles className="h-3.5 w-3.5" /> {lesson.badge}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
          {lesson.title}
        </h1>

        <p className="text-slate-300 text-base leading-relaxed mb-6">
          {lesson.introParagraph}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          {lesson.concepts.map((c) => (
            <div key={c.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <Layers className="h-4 w-4 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-sm text-white">{c.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{c.description}</p>
            </div>
          ))}
        </div>

        <AgentPlayground initialCode={lesson.starterCode} customNodes={lesson.graphNodes} />

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mt-8">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Hands-On Challenge
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {lesson.challengePrompt}
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
          {prevLesson ? (
            <Link
              href={`/tutorials/${prevLesson.slug}`}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-400"
            >
              <ArrowLeft className="h-4 w-4" /> {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}

          {nextLesson && (
            <Link
              href={`/tutorials/${nextLesson.slug}`}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              Next: {nextLesson.title} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            AI
          </div>
          <span className="font-bold text-lg tracking-tight">
            Agent<span className="text-emerald-400">Playground</span>
          </span>
        </Link>
        <div className="text-xs text-slate-400 font-mono">
          Interactive AI Engineering Tutorials
        </div>
      </header>

      <Suspense fallback={<div className="text-slate-400 p-10">Loading lesson...</div>}>
        <LessonContainer params={params} />
      </Suspense>
    </div>
  );
}