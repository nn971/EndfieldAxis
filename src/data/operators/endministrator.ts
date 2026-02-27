import { applyBuff, physicalHitByRank } from "../../simulator/skillOps";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";
import type { SimRegistry } from "../../simulator/listeners/registry";

const NS_DMG_MUL = [
  1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3.0, 3.23, 3.5,
] as const;

const CS_DMG_MUL = [
  0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1.0,
] as const;

const ULT_DMG_MUL = [
  3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8.0,
] as const;

const ULT_BONUS_DMG_MUL = [
  2.67, 2.94, 3.2, 3.47, 3.74, 4.0, 4.27, 4.54, 4.8, 5.14, 5.54, 6.0,
] as const;

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

class EndministratorDef extends OperatorDef {
  constructor() {
    super({
      id: "endministrator",
      name: "Endministrator",
      avatar: "ENDMINISTRATOR.png",
      attributes: {
        main: "agility",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 14,
          agility: 14,
          intellect: 9,
          will: 10,
        },
        level90: {
          attack: 319,
          strength: 123,
          agility: 140,
          intellect: 96,
          will: 107,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Destructive Sequence",
          durationFrames: 300,
          icon: "ENDMINISTRATOR_NA.png",
        },
        normalSkill: {
          name: "Constructive Sequence",
          durationFrames: 48,
          icon: "ENDMINISTRATOR_NS.png",
          timeline: [
            physicalHitByRank(24, {
              rankTable: NS_DMG_MUL,
              rankSkillType: "normalSkill",
              withStatus: true,
              statusType: "crush",
            }),
          ],
        },
        comboSkill: {
          name: "Sealing Sequence",
          durationFrames: 46,
          icon: "ENDMINISTRATOR_CS.png",
          timeline: [
            applyBuff(45, "buff.crystal"),
            physicalHitByRank(45, {
              rankTable: CS_DMG_MUL,
              rankSkillType: "comboSkill",
              withStatus: false,
            }),
          ],
        },
        ultimate: {
          name: "Bombardment Sequence",
          durationFrames: 110,
          icon: "ENDMINISTRATOR_ULT.png",
          timeline: [
            physicalHitByRank(55, {
              rankTable: ULT_DMG_MUL,
              rankSkillType: "ultimate",
              withStatus: false,
            }),
            physicalHitByRank(56, {
              rankTable: ULT_BONUS_DMG_MUL,
              rankSkillType: "ultimate",
              withStatus: false,
            }),
          ],
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 110;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerAfterHit({
      id: "operator.endministrator.combo.triggerOnAllyComboHit",
      fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
        if (sourceId === this.id) return [];
        const source = read.getEntity(sourceId);
        if (!source || source.type !== "operator") return [];

        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isComboHit =
          parent?.type === "castStart" && parent.skillType === "comboSkill";
        if (!isComboHit) return [];

        return [
          {
            id: makeEventId(),
            type: "comboTriggered",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: this.id,
            targetId: ev.targetId,
            ref: ev.id,
          },
        ];
      },
    });

    registry.registerOnBuffConsumedForBuff({
      buffId: "buff.crystal",
      id: "operator.endministrator.talent1.onCrystalConsumed",
      fn: ({ read, ev, nextSeq, makeEventId }) => {
        if (!read.env.entitiesById[this.id]) return [];
        const build = read.getBuild(this.id);
        const talentRank = Number(build?.talentRanks?.talent1 ?? 0);
        if (talentRank <= 0) return [];
        // Only respond to crystal removals caused by explicit consume flow.
        if (ev.ref === undefined || ev.ref === null) return [];

        const buffId =
          talentRank >= 2
            ? "buff.endministrator.talent1.atkInc"
            : "buff.endministrator.talent1.atkInc.low";

        return [
          {
            id: makeEventId(),
            type: "buffApply",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: this.id,
            targetId: this.id,
            ownerId: this.id,
            buffId: buffId as any,
            ref: ev.id,
          },
        ];
      },
    });

    registry.registerOnBuffApplyForBuff({
      buffId: "buff.endministrator.talent1.atkInc" as any,
      id: "operator.endministrator.potential2.shareAtkBuff.high",
      fn: ({ read, ev, nextSeq, makeEventId }) => {
        if (ev.ownerId !== this.id) return [];
        const build = read.getBuild(this.id);
        if (Number(build?.potentialRank ?? 0) < 2) return [];

        return Object.values(read.env.entitiesById)
          .filter(e => e.type === "operator" && e.id !== this.id)
          .map(e => ({
            id: makeEventId(),
            type: "buffApply" as const,
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: this.id,
            targetId: e.id,
            ownerId: e.id,
            buffId: "buff.endministrator.potential2.teamAtkShare.high" as any,
            ref: ev.id,
          }));
      },
    });

    registry.registerOnBuffApplyForBuff({
      buffId: "buff.endministrator.talent1.atkInc.low" as any,
      id: "operator.endministrator.potential2.shareAtkBuff.low",
      fn: ({ read, ev, nextSeq, makeEventId }) => {
        if (ev.ownerId !== this.id) return [];
        const build = read.getBuild(this.id);
        if (Number(build?.potentialRank ?? 0) < 2) return [];

        return Object.values(read.env.entitiesById)
          .filter(e => e.type === "operator" && e.id !== this.id)
          .map(e => ({
            id: makeEventId(),
            type: "buffApply" as const,
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: this.id,
            targetId: e.id,
            ownerId: e.id,
            buffId: "buff.endministrator.potential2.teamAtkShare.low" as any,
            ref: ev.id,
          }));
      },
    });
  }
}

export default new EndministratorDef();
