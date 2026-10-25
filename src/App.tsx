import { useEffect, useState } from "react";
import { BookOpen, Plus, Library, Trash2, Check, Bookmark, Clock3 } from "lucide-react";

type Status = "Want to Read" | "Reading" | "Finished";

interface Book {
  id: string;
  title: string;
  status: Status;
}

type Filter = "All" | Status;

const STORAGE_KEY = "reading-list-books";
const MAX_TITLE_LENGTH = 60;

function normalize(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

const STATUS_META: Record<Status, { icon: typeof BookOpen; dot: string; chip: string }> = {
  "Want to Read": { icon: Bookmark, dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 ring-amber-200" },
  "Reading": { icon: Clock3, dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  "Finished": { icon: Check, dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

const STATUSES: Status[] = ["Want to Read", "Reading", "Finished"];
const FILTERS: Filter[] = ["All", "Want to Read", "Reading", "Finished"];

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is Book =>
        b &&
        typeof b.id === "string" &&
        typeof b.title === "string" &&
        STATUSES.includes(b.status)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [title, setTitle] = useState("");
  const [initialStatus, setInitialStatus] = useState<Status>("Want to Read");
  const [filter, setFilter] = useState<Filter>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [openMenuId]);

  const addBook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_TITLE_LENGTH) {
      setError("Book title must be 60 characters or fewer.");
      return;
    }
    const normalized = normalize(trimmed);
    if (books.some((b) => normalize(b.title) === normalized)) {
      setError("This book is already in your reading list.");
      return;
    }
    setError(null);
    setBooks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: trimmed, status: initialStatus },
    ]);
    setTitle("");
  };

  const changeStatus = (id: string, status: Status) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    setOpenMenuId(null);
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setOpenMenuId(null);
  };

  const visible = filter === "All" ? books : books.filter((b) => b.status === filter);

  const counts = {
    "Want to Read": books.filter((b) => b.status === "Want to Read").length,
    "Reading": books.filter((b) => b.status === "Reading").length,
    "Finished": books.filter((b) => b.status === "Finished").length,
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
            <Library size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-stone-900">
              Reading List
            </h1>
            <p className="text-xs text-stone-500">
              {books.length === 0
                ? "Track books you want to read"
                : `${books.length} ${books.length === 1 ? "book" : "books"} on your shelf`}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        {/* Add form */}
        <form
          onSubmit={addBook}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <label htmlFor="book-title" className="mb-1.5 block text-sm font-medium text-stone-700">
            Add a book
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Book title"
              className={`flex-1 rounded-xl border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-200 ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : "border-stone-200 focus:border-stone-400 focus:ring-stone-200"
              }`}
            />
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as Status)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-200 sm:w-44"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!title.trim()}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
          )}
        </form>

        {/* Summary */}
        {books.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <SummaryCard label="Total Books" value={books.length} icon={<Library size={16} strokeWidth={2} />} accent="text-stone-900 bg-stone-100" />
            <SummaryCard label="Currently Reading" value={counts.Reading} icon={<Clock3 size={16} strokeWidth={2} />} accent="text-sky-700 bg-sky-50" />
            <SummaryCard label="Finished" value={counts.Finished} icon={<Check size={16} strokeWidth={2.5} />} accent="text-emerald-700 bg-emerald-50" />
          </div>
        )}

        {/* Filters */}
        {books.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f;
              const count =
                f === "All" ? books.length : counts[f as Status];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {f !== "All" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[f as Status].dot}`} />
                  )}
                  {f}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Book grid / empty state */}
        {books.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-14 text-center">
            <BookOpen size={36} className="text-stone-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-stone-600">
              No books in this category yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((book) => {
              const meta = STATUS_META[book.status];
              const Icon = meta.icon;
              const menuOpen = openMenuId === book.id;
              return (
                <div
                  key={book.id}
                  className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                        <BookOpen size={18} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold leading-snug text-stone-900">
                          {book.title}
                        </h3>
                        <span
                          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.chip}`}
                      >
                        <Icon size={12} strokeWidth={2.5} />
                        {book.status}
                      </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeBook(book.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete book"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(menuOpen ? null : book.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                          aria-label="Book actions"
                        >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div
                          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                            Move to
                          </div>
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => changeStatus(book.id, s)}
                              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-stone-50 ${
                                s === book.status ? "font-semibold text-stone-900" : "text-stone-600"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
                              {s}
                              {s === book.status && <Check size={14} className="ml-auto" />}
                            </button>
                          ))}
                          <div className="my-1 border-t border-stone-100" />
                          <button
                            onClick={() => removeBook(book.id)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-stone-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold leading-none text-stone-900">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <BookOpen size={28} strokeWidth={1.5} />
      </div>
      <p className="mt-4 max-w-xs text-sm font-medium text-stone-700">
        Your reading list is empty. Add your first book.
      </p>
      <p className="mt-1 text-xs text-stone-400">
        Use the form above to start building your shelf.
      </p>
    </div>
  );
}
