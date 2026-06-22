'use client';

import { useState, useRef } from 'react';
import AppShell from '../../components/AppShell';
import ErrorBox from '../../components/ErrorBox';

export default function AiPhotosPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    setResultImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResultImage(null);

    try {
      const res = await fetch('/api/ai-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, prompt: prompt.trim() }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao gerar.');
        return;
      }

      setResultImage(data.image);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold">AI Fotos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Envie uma imagem e um prompt para editá-la com IA.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <p className="text-sm font-semibold">Imagem original</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-60 cursor-pointer items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-400 dark:border-slate-600 dark:bg-slate-950"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl">📷</div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Clique para enviar
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            {preview && (
              <button
                type="button"
                onClick={clearImage}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                Remover foto
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-semibold">Prompt de edição</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  image
                    ? 'Ex.: Transforme esta imagem em estilo aquarela...'
                    : 'Ex.: Gere uma imagem de uma montanha ao pôr do sol...'
                }
                className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <button
              disabled={loading || !prompt.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Enviar'}
            </button>

            <ErrorBox error={error} />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">Imagem gerada</p>
            <div className="flex h-60 items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-950">
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Imagem gerada"
                  className="h-full w-full rounded-3xl object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl">🎨</div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {loading ? 'Gerando...' : 'Resultado aparecerá aqui'}
                  </p>
                </div>
              )}
            </div>
            {resultImage && (
              <a
                href={resultImage}
                download="imagem-gerada.png"
                className="block rounded-2xl border border-slate-200 px-5 py-2 text-center text-sm font-semibold dark:border-slate-700"
              >
                Baixar
              </a>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
