import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/skillOps";
import { delay } from "../../simulator/scripts";
import type { SimEnv } from "../../types/simulator/simulator";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const PLACEHOLDER_ICON = "placeholder.jpg";

const NS_DMG_MUL = [
  1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2,
] as const;

const CS_DMG_MUL_PER_SEQ = [
  0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8,
] as const;

const CS_COOLDOWN_SECONDS = [
  10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9,
] as const;

const ULT_SP_RECOVERY = [
  58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80,
] as const;

const CS_SP_RECOVERY_PER_SEQ = new Array(12).fill(7.5) as readonly number[];

class AkekuriDef extends OperatorDef {
  constructor() {
    super({
      id: "akekuri",
      name: "Akekuri",
      avatar: "AKEKURI.png",
      attributes: {
        main: "agility",
        sub: "intellect",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 13,
          agility: 15,
          intellect: 12,
          will: 9,
        },
        level90: {
          attack: 319,
          strength: 110,
          agility: 140,
          intellect: 106,
          will: 108,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Sword of Aspiration",
          durationFrames: 300,
          icon: PLACEHOLDER_ICON,
        },
        normalSkill: {
          name: "Burst of Passion",
          durationFrames: 56,
          icon: PLACEHOLDER_ICON,
          script: function* (ctx) {
            yield delay(28);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
            });
            yield ctx.emit.inflictionApply({
              inflictionType: "heat",
              inflictionStacks: 1,
            });
          },
        },
        comboSkill: {
          name: "Flash and Dash",
          durationFrames: 66,
          icon: PLACEHOLDER_ICON,
          script: function* (ctx) {
            const dmg = pickSkillValueByRank(ctx, CS_DMG_MUL_PER_SEQ);
            const sp = pickSkillValueByRank(ctx, CS_SP_RECOVERY_PER_SEQ);

            yield delay(24);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: dmg,
            });
            yield ctx.emit.spRecover({ amount: sp });

            yield delay(20);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: dmg,
            });
            yield ctx.emit.spRecover({ amount: sp });
          },
        },
        ultimate: {
          name: "SQUAD! ON ME!",
          durationFrames: 180,
          icon: PLACEHOLDER_ICON,
          script: function* (ctx) {
            const amount = pickSkillValueByRank(ctx, ULT_SP_RECOVERY) * (1 / 3);
            yield delay(40);
            yield ctx.emit.spRecover({ amount });
            yield delay(45);
            yield ctx.emit.spRecover({ amount });
            yield delay(45);
            yield ctx.emit.spRecover({ amount });
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 120;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 8;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerOnCastStart({
      id: "global.link.consumeOnCastStart",
      fn: ({ read, ev }) => {
        const globalBuffs = (read.env as SimEnv).globalBuffs;
        const link = globalBuffs.link;

        if (
          link?.stacks &&
          (ev.skillType === "normalSkill" ||
            ev.skillType === "comboSkill" ||
            ev.skillType === "ultimate")
        ) {
          const perStackBonus = ev.skillType === "ultimate" ? 0.2 : 0.3;
          const multiplier = 1 + Number(link.stacks) * perStackBonus;
          link.castBonusByCastStartId ??= {};
          link.castBonusByCastStartId[ev.id] = multiplier;
          link.stacks = 0;
        }

        // Akekuri talent placeholder: while ultimate is active, gains Link.
        if (ev.sourceId === this.id && ev.skillType === "ultimate") {
          const state = (globalBuffs.link ??= {
            stacks: 0,
            castBonusByCastStartId: {},
          });
          state.stacks = Math.min(
            4,
            Math.max(0, Number(state.stacks ?? 0)) + 1,
          );
        }

        return null;
      },
    });

    registry.registerOnCastEnd({
      id: "global.link.cleanupCastMap",
      fn: ({ read, ev }) => {
        const globalBuffs = (read.env as SimEnv).globalBuffs;
        const map = globalBuffs?.link?.castBonusByCastStartId;
        if (map && ev.ref) {
          delete map[ev.ref];
        }
        return null;
      },
    });

    registry.registerGlobalDamageBonus({
      id: "global.link.specialMul",
      fn: ({ read, ev, collector }) => {
        if (!ev || ev.type !== "hit") return;
        const castStartId = ev.ref;
        if (!castStartId) return;

        const map = (read.env as SimEnv).globalBuffs?.link
          ?.castBonusByCastStartId;
        const multiplier = Number(map?.[castStartId] ?? 0);
        if (!Number.isFinite(multiplier) || multiplier <= 1) return;

        collector.addValue(
          "specialMul",
          multiplier - 1,
          `Link special multiplier x${multiplier.toFixed(2)}`,
        );
      },
    });
  }
}

export default new AkekuriDef();
