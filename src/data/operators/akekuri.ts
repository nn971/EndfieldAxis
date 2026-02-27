import type { SimRegistry } from "../../simulator/listeners/registry";
import type { SimEnvWithGlobalBuffs } from "../../types/simulator/simulator";
import {
  artsHitByRank,
  physicalHitByRank,
  spRecoverByRank,
} from "../../simulator/skillOps";
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
          timeline: [
            artsHitByRank(28, {
              rankTable: NS_DMG_MUL,
              rankSkillType: "normalSkill",
              dmgType: "heat",
              withInfliction: true,
            }),
          ],
        },
        comboSkill: {
          name: "Flash and Dash",
          durationFrames: 66,
          icon: PLACEHOLDER_ICON,
          timeline: [
            physicalHitByRank(24, {
              rankTable: CS_DMG_MUL_PER_SEQ,
              rankSkillType: "comboSkill",
            }),
            spRecoverByRank(24, {
              rankTable: CS_SP_RECOVERY_PER_SEQ,
              rankSkillType: "comboSkill",
            }),
            physicalHitByRank(44, {
              rankTable: CS_DMG_MUL_PER_SEQ,
              rankSkillType: "comboSkill",
            }),
            spRecoverByRank(44, {
              rankTable: CS_SP_RECOVERY_PER_SEQ,
              rankSkillType: "comboSkill",
            }),
          ],
        },
        ultimate: {
          name: "SQUAD! ON ME!",
          durationFrames: 180,
          icon: PLACEHOLDER_ICON,
          timeline: [
            spRecoverByRank(40, {
              rankTable: ULT_SP_RECOVERY,
              rankSkillType: "ultimate",
              ratio: 1 / 3,
            }),
            spRecoverByRank(85, {
              rankTable: ULT_SP_RECOVERY,
              rankSkillType: "ultimate",
              ratio: 1 / 3,
            }),
            spRecoverByRank(130, {
              rankTable: ULT_SP_RECOVERY,
              rankSkillType: "ultimate",
              ratio: 1 / 3,
            }),
          ],
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerOnCastStart({
      id: "global.link.consumeOnCastStart",
      fn: ({ read, ev }) => {
        const globalBuffs = (read.env as SimEnvWithGlobalBuffs).globalBuffs;
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

        return [];
      },
    });

    registry.registerOnCastEnd({
      id: "global.link.cleanupCastMap",
      fn: ({ read, ev }) => {
        const globalBuffs = (read.env as SimEnvWithGlobalBuffs).globalBuffs;
        const map = globalBuffs?.link?.castBonusByCastStartId;
        if (map && ev.ref) {
          delete map[ev.ref];
        }
        return [];
      },
    });

    registry.registerGlobalDamageBonus({
      id: "global.link.specialMul",
      fn: ({ read, ev, collector }) => {
        if (!ev || ev.type !== "hit") return;
        const castStartId = ev.ref;
        if (!castStartId) return;

        const map = (read.env as SimEnvWithGlobalBuffs).globalBuffs?.link
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
