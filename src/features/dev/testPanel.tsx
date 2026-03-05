import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '../../app/hooks';
import { runSolutionSim } from '../sim/runSolutionSim';
import { selectSolution } from '../solution/selectors';
import {
  compareSimTestCase,
  createSimTestCase,
  deserializeSimTestCase,
  type SimTestCompareMode,
  serializeSimTestCase,
} from './testCaseSL';

export default function TestPanel() {
  const { t } = useTranslation();
  const solution = useAppSelector(selectSolution);

  const [text, setText] = useState<string>('');
  const [mode, setMode] = useState<SimTestCompareMode>('eventTypes');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const STORAGE_KEY = 'endfieldaxis.dev.simTestCase.v2';

  const hasText = useMemo(() => text.trim().length > 0, [text]);

  const formatDevTestError = (code: string, meta?: Record<string, unknown>): string =>
    t(`devTest.errors.${code}`, meta);

  const onGenerate = () => {
    setError('');
    setResult('');
    try {
      const simResult = runSolutionSim(solution);
      const testCase = createSimTestCase(solution, simResult);
      setText(serializeSimTestCase(testCase));
      setResult(
        t('devTest.resultGeneratedStandard', {
          events: testCase.expected.eventTypes.length,
          hitSnapshots: testCase.expected.hitDamageBuckets.length,
          staggerPoints: testCase.expected.enemyStaggerSeries.length,
        }),
      );
    } catch {
      setError(t('devTest.errorFailedGenerateFromSolution'));
    }
  };

  const onCompare = () => {
    setError('');
    setResult('');

    const parsed = deserializeSimTestCase(text);
    if (!parsed.ok) {
      setError(formatDevTestError(parsed.code, parsed.meta));
      return;
    }

    try {
      const simResult = runSolutionSim(parsed.testCase.solution);
      const compared = compareSimTestCase(parsed.testCase, simResult, mode);
      setResult(formatDevTestError(compared.code, compared.meta));
    } catch {
      setError(t('devTest.errorFailedRunSimulationForComparison'));
    }
  };

  const onDownload = () => {
    setError('');
    setResult('');
    if (!hasText) {
      setError(t('devTest.errorNoTextToDownload'));
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('devTest.downloadFilename');
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickFile = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async e => {
    setError('');
    setResult('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);
      const parsed = deserializeSimTestCase(content);
      if (!parsed.ok) {
        setError(formatDevTestError(parsed.code, parsed.meta));
        return;
      }
      setResult(t('devTest.resultLoadedFromFile'));
    } catch {
      setError(t('devTest.errorFailedReadFile'));
    }
  };

  const onSaveToBrowser = () => {
    setError('');
    setResult('');
    if (!hasText) {
      setError(t('devTest.errorNoTextToSave'));
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, text);
      setResult(t('devTest.resultSavedToLocalStorage'));
    } catch {
      setError(t('devTest.errorFailedWriteLocalStorage'));
    }
  };

  const onLoadFromBrowser = () => {
    setError('');
    setResult('');
    let content: string | null = null;
    try {
      content = localStorage.getItem(STORAGE_KEY);
    } catch {
      setError(t('devTest.errorFailedReadLocalStorage'));
      return;
    }
    if (!content) {
      setError(t('devTest.errorNoSavedInLocalStorage'));
      return;
    }

    setText(content);
    const parsed = deserializeSimTestCase(content);
    if (!parsed.ok) {
      setError(formatDevTestError(parsed.code, parsed.meta));
      return;
    }
    setResult(t('devTest.resultLoadedFromLocalStorage'));
  };

  return (
    <div
      className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-900"
      data-testid="panel-dev-test"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('devTest.heading')}</h2>
          <div className="text-xs text-zinc-400">
            {t('devTest.helperText')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onGenerate}
          >
            {t('devTest.generateStandard')}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onCompare}
            disabled={!hasText}
            title={hasText ? undefined : t('devTest.tooltipNeedJson')}
          >
            {t('devTest.compareCurrent')}
          </button>

          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onDownload}
          >
            {t('devTest.downloadJson')}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onPickFile}
          >
            {t('devTest.uploadJson')}
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onSaveToBrowser}
          >
            {t('devTest.saveToBrowser')}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={onLoadFromBrowser}
          >
            {t('devTest.loadFromBrowser')}
          </button>

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/json"
            onChange={onFileChosen}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="text-zinc-300">{t('devTest.compareModeLabel')}</span>
        <button
          type="button"
          className={`px-2 py-1 rounded border ${
            mode === 'eventTypes'
              ? 'border-zinc-500 bg-zinc-700'
              : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
          }`}
          onClick={() => setMode('eventTypes')}
        >
          {t('devTest.modeEventTypes')}
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded border ${
            mode === 'hitDamageBuckets'
              ? 'border-zinc-500 bg-zinc-700'
              : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
          }`}
          onClick={() => setMode('hitDamageBuckets')}
        >
          {t('devTest.modeHitDamage')}
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded border ${
            mode === 'enemyStaggerSeries'
              ? 'border-zinc-500 bg-zinc-700'
              : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
          }`}
          onClick={() => setMode('enemyStaggerSeries')}
        >
          {t('devTest.modeStagger')}
        </button>
      </div>

      {error ? (
        <div className="mt-2 text-xs text-red-300">
          {t('devTest.errorLabel')}: {error}
        </div>
      ) : null}
      {result ? <div className="mt-2 text-xs text-emerald-300">{result}</div> : null}

      <div className="mt-3">
        <textarea
          className="w-full h-[220px] rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-5 font-mono"
          placeholder={t('devTest.textareaPlaceholder')}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
    </div>
  );
}
