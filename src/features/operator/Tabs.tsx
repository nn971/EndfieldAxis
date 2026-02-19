import { OperatorBuild } from "../../types/operator";
import PreviewSlider from "../../shared/components/PreviewSlider";

type TabProps = {
  operatorId: string;
  build: OperatorBuild;
  onCommit: (operatorId: string, patch: Partial<OperatorBuild>) => void;
};

export function OperatorBuildTab({ operatorId, build, onCommit }: TabProps) {
  return (
    <div>
      <PreviewSlider
        label="Level"
        min={1}
        max={90}
        value={build.level}
        onCommit={v => onCommit(operatorId, { level: v })}
      />

      <PreviewSlider
        label="Potential"
        min={0}
        max={5}
        value={build.potentialRank}
        onCommit={v => onCommit(operatorId, { potentialRank: v })}
      />

      <PreviewSlider
        label="Talent1"
        min={0}
        max={2}
        value={build.talentRanks.talent1}
        onCommit={v =>
          onCommit(operatorId, {
            talentRanks: { ...build.talentRanks, talent1: v },
          })
        }
      />

      <PreviewSlider
        label="Talent2"
        min={0}
        max={2}
        value={build.talentRanks.talent2}
        onCommit={v =>
          onCommit(operatorId, {
            talentRanks: { ...build.talentRanks, talent2: v },
          })
        }
      />
    </div>
  );
}

export function WeaponTab({ operatorId, build, onCommit }: TabProps) {
  return <div>Weapon Page Placeholder</div>;
}

export function GearsTab({ operatorId, build, onCommit }: TabProps) {
  return <div>Gears Page Placeholder</div>;
}
