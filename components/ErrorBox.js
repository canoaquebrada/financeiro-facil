export default function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
      {error}
    </div>
  );
}
