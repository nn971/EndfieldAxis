import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3.0, 3.23, 3.5,
] as const;

const CS_DMG_MUL_NON_SOLIDIFIED = [
  1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6,
] as const;

const CS_DMG_MUL_SOLIDIFIED = [
  2.8, 3.08, 3.36, 3.64, 3.92, 4.2, 4.48, 4.76, 5.04, 5.39, 5.81, 6.3,
] as const;

const ULT_DMG_MUL = [
  4.89, 5.38, 5.86, 6.35, 6.84, 7.33, 7.82, 8.31, 8.8, 9.41, 10.14, 11.0,
] as const;

const CS_COOLDOWN_SECONDS = [
  18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17,
] as const;

class EstellaDef extends OperatorDef {
  constructor() {
    super({
      id: "estella",
      name: "Estella",
      avatar: "ESTELLA.png",
      attributes: {
        main: "strength",
        sub: "agility",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 13,
          agility: 8,
          intellect: 14,
          will: 15,
        },
        level90: {
          attack: 312,
          strength: 104,
          agility: 97,
          intellect: 110,
          will: 151,
        },
      },
      weaponType: "polearm",
      skills: {
        normalAttack: {
          name: "Audio Noise",
          durationFrames: 300,
          icon: "ESTELLA_NA.png",
        },
        normalSkill: {
          name: "Onomatopoeia",
          durationFrames: 52,
          icon: "ESTELLA_NS.png",
          script: function* (ctx) {
            yield delay(26);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
            });
            yield ctx.emit.inflictionApply({
              inflictionType: "cryo",
              inflictionStacks: 1,
            });
          },
        },
        comboSkill: {
          name: "Distortion",
          durationFrames: 52,
          icon: "ESTELLA_CS.png",
          script: function* (ctx) {
            yield delay(34);
            yield ctx.emit.statusApply({
              statusType: "lift",
            });

            const target = ctx.read.getEntity(ctx.targetId);
            const isSolidified = Boolean(
              (target as any)?.buffs?.["buff.solidification"],
            );

            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: isSolidified
                ? pickSkillValueByRank(ctx, CS_DMG_MUL_SOLIDIFIED)
                : pickSkillValueByRank(ctx, CS_DMG_MUL_NON_SOLIDIFIED),
            });

            if (isSolidified) {
              yield ctx.emit.buffApply({
                buffId: "buff.estella.combo.physicalSusceptibility",
              });
            }
          },
        },
        ultimate: {
          name: "Tremolo",
          durationFrames: 110,
          icon: "ESTELLA_ULT.png",
          script: function* (ctx) {
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_DMG_MUL),
            });
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 130;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 9;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    registry.registerOnBuffApply({
      id: "operator.estella.combo.triggerOnSolidification",
      when: { buffId: "buff.solidification" },
      fn: function* ({ read, ev, emit }) {
        if (!read.env.entitiesById[selfId]) return;
        if (ev?.type !== "buffApply") return;

        yield emit.comboTriggered({
          sourceId: selfId,
          targetId: ev.targetId,
        });
      },
    });
  }
}

export default new EstellaDef();
