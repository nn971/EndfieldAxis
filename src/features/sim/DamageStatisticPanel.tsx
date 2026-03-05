import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import operatorsData from '../../data/operators';
import type { SkillType } from '../../data/operators/OperatorDef';
import type { DamageWatchEntry } from '../../types/editor';
import { DAMAGE_TYPE_LIST } from '../../types/operator';
import type { DamageType } from '../../types/operator';
import {
  selectDamageWatches,
  selectSimDamageCache,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from '../solution/selectors';
import {
  damageWatchAdded,
  damageWatchDeleted,
  damageWatchPatched,
} from '../solution/solutionSlice';

const SKILL_TYPES: SkillType[] = [
  'normalAttack',
  'normalSkill',
  'comboSkill',
  'ultimate',
];

export default function DamageStatisticPanel() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const simDamageCache = useAppSelector(selectSimDamageCache);
  const damageWatches = useAppSelector(selectDamageWatches);
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const skillBoxes = useAppSelector(selectSkillBoxes);

  const operatorOptions = useMemo(() => {
    const ids = new Set<string>([...teamOperatorIds]);
    skillBoxes.forEach(box => {
      ids.add(box.operatorId);
    });
    return Array.from(ids).sort();
  }, [teamOperatorIds, skillBoxes]);

  const watchResults = useMemo(() => {
    const { hitDamageSnapshots, totalDamage } = simDamageCache;
    return damageWatches.map(watch => {
      const matches = hitDamageSnapshots.filter(hit => {
        if (watch.filter.sourceId && hit.sourceId !== watch.filter.sourceId) {
          return false;
        }
        if (watch.filter.skillType && hit.castSkillType !== watch.filter.skillType) {
          return false;
        }
        if (watch.filter.damageType && hit.damageType !== watch.filter.damageType) {
          return false;
        }
        return true;
      });
      const damage = matches.reduce((sum, h) => sum + h.amount, 0);
      const percent = totalDamage > 0 ? (damage / totalDamage) * 100 : 0;
      return { watch, damage, hits: matches.length, percent };
    });
  }, [simDamageCache, damageWatches]);

  const hasData = simDamageCache.hitDamageSnapshots.length > 0;
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language],
  );

  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t('damageStats.heading')}</h2>
        <div className="text-xs text-zinc-400">
          {hasData
            ? t('damageStats.lastRunWithHits', {
                count: simDamageCache.hitDamageSnapshots.length,
              })
            : t('damageStats.lastRunEmpty')}
        </div>
      </div>

      <div className="mb-4 rounded bg-zinc-800/50 p-3">
        <div className="mb-1 text-xs text-zinc-400">{t('damageStats.totalDamage')}</div>
        <div className="text-2xl font-bold">
          {hasData
            ? numberFormatter.format(simDamageCache.totalDamage)
            : t('damageStats.clickRun')}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">
            {t('damageStats.watches')}
          </h3>
          <button
            type="button"
            onClick={() =>
              dispatch(
                damageWatchAdded({
                  name: t('damageStats.watchName', {
                    index: damageWatches.length + 1,
                  }),
                }),
              )
            }
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
          >
            {t('damageStats.addWatch')}
          </button>
        </div>

        {damageWatches.length === 0 ? (
          <div className="text-xs italic text-zinc-500">
            {t('damageStats.noWatches')}
          </div>
        ) : (
          <div className="space-y-3">
            {watchResults.map(({ watch, damage, hits, percent }) => (
              <WatchRow
                key={watch.id}
                watch={watch}
                damage={damage}
                hits={hits}
                percent={percent}
                operatorOptions={operatorOptions}
                locale={i18n.language}
                onPatch={patch =>
                  dispatch(damageWatchPatched({ id: watch.id, patch }))
                }
                onDelete={() => dispatch(damageWatchDeleted({ id: watch.id }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WatchRow({
  watch,
  damage,
  hits,
  percent,
  operatorOptions,
  locale,
  onPatch,
  onDelete,
}: {
  watch: DamageWatchEntry;
  damage: number;
  hits: number;
  percent: number;
  operatorOptions: string[];
  locale: string;
  onPatch: (patch: Partial<Omit<DamageWatchEntry, 'id'>>) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(watch.name);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const handleNameBlur = () => {
    if (editingName.trim() && editingName !== watch.name) {
      onPatch({ name: editingName.trim() });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="rounded border border-zinc-700/50 bg-zinc-800/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="flex-1 border-b border-zinc-600 bg-transparent text-sm font-medium focus:border-zinc-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-zinc-500 hover:text-red-400"
          title={t('damageStats.deleteWatch')}
        >
          x
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <select
          value={watch.filter.sourceId ?? ''}
          onChange={e =>
            onPatch({
              filter: { ...watch.filter, sourceId: e.target.value || null },
            })
          }
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs"
        >
          <option value="">{t('damageStats.anyOperator')}</option>
          {operatorOptions.map(opId => (
            <option key={opId} value={opId}>
              {operatorsData[opId]?.name ?? opId}
            </option>
          ))}
        </select>

        <select
          value={watch.filter.skillType ?? ''}
          onChange={e =>
            onPatch({
              filter: {
                ...watch.filter,
                skillType: (e.target.value as SkillType) || null,
              },
            })
          }
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs"
        >
          <option value="">{t('damageStats.anySkill')}</option>
          {SKILL_TYPES.map(st => (
            <option key={st} value={st}>
              {t(`damageStats.skillTypes.${st}`)}
            </option>
          ))}
        </select>

        <select
          value={watch.filter.damageType ?? ''}
          onChange={e =>
            onPatch({
              filter: {
                ...watch.filter,
                damageType: (e.target.value as DamageType) || null,
              },
            })
          }
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs"
        >
          <option value="">{t('damageStats.anyType')}</option>
          {DAMAGE_TYPE_LIST.map(dt => (
            <option key={dt} value={dt}>
              {t(`damageStats.damageTypes.${dt}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-zinc-500">{t('damageStats.damageLabel')}:</span>{' '}
          <span className="font-medium">
            {numberFormatter.format(damage)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500">{t('damageStats.hitsLabel')}:</span>{' '}
          <span className="font-medium">{hits}</span>
        </div>
        <div>
          <span className="text-zinc-500">%:</span>{' '}
          <span className="font-medium">{percent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
