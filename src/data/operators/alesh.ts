import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5,
] as const;

const CS_DMG_MUL = [
  1.33, 1.47, 1.6, 1.73, 1.87, 2.0, 2.13, 2.27, 2.4, 2.57, 2.77, 3.0,
] as const;

const CS_DMG_MUL_RARE_FIN = [
  2.13, 2.35, 2.56, 2.77, 2.99, 3.2, 3.41, 3.63, 3.84, 4.11, 4.43, 4.8,
] as const;

const ULT_DMG_MUL = [
  4.36, 4.79, 5.23, 5.66, 6.1, 6.53, 6.97, 7.41, 7.84, 8.39, 9.04, 9.8,
] as const;

const NA_HIT1_DMG_MUL = [
  0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39,
] as const;
const NA_HIT2_DMG_MUL = [
  0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23,
] as const;
const NA_HIT3_DMG_MUL = [
  0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62,
] as const;
const NA_HIT4_DMG_MUL = [
  0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62,
] as const;
const NA_HIT5_DMG_MUL = [
  0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24,
] as const;

const CS_COOLDOWN_SECONDS = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8] as const;

const RARE_FIN_CHANCE = 0.1;
const RARE_FIN_TEAM_ATK_BUFF_KEY = "buff.alesh.rareFin.teamAtk" as const;
const RARE_FIN_TEAM_ATK_BUFF_DURATION_FRAMES = 600;
const RARE_FIN_TEAM_ATK_BUFF_RATIO = 0.15;

class AleshDef extends OperatorDef {
  constructor() {
    super({
      id: "alesh",
      name: "Alesh",
      avatar: "ALESH.png",
      attributes: {
        main: "strength",
        sub: "intellect",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 20,
          agility: 9,
          intellect: 13,
          will: 10,
        },
        level90: {
          attack: 309,
          strength: 158,
          agility: 95,
          intellect: 125,
          will: 89,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Basic Rod Casting",
          durationFrames: 300,
          icon: "ALESH_NA.png",
          staggerOnHit: 17,
          script: function* (ctx) {
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT5_DMG_MUL[r] ?? 0),
              staggerOnHit: 17,
            });
          },
        },
        normalSkill: {
          name: "Unconventional Lure",
          durationFrames: 100,
          icon: "ALESH_NS.png",
          script: function* (ctx) {
            yield delay(54);
            const target = ctx.read.getEntity(ctx.targetId ?? null);
            const cryoStacks = (target as any)?.inflictions?.cryo?.stacks ?? 0;
            if (cryoStacks > 0) {
              yield ctx.emit.inflictionRemove({
                targetId: ctx.targetId!,
                inflictionType: "cryo",
              });
              yield ctx.emit.buffApply({
                buffId: "buff.solidification",
              });
              const potential =
                ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0;
              yield ctx.emit.spRecover({
                amount: ctx.byRank!(
                  r =>
                    10 * cryoStacks +
                    (r >= 9 ? 5 : 0) +
                    (potential >= 1 ? 10 : 0),
                ),
              });
            }
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Auger Angling",
          durationFrames: 78,
          icon: "ALESH_CS.png",
          script: function* (ctx) {
            yield delay(36);
            const potentialRank = Number(
              ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0,
            );
            const isRareFin = ctx.read.random() < RARE_FIN_CHANCE;
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: isRareFin
                ? ctx.byRank!(r => CS_DMG_MUL_RARE_FIN[r] ?? 0)
                : ctx.byRank!(r => CS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
            if (isRareFin && potentialRank >= 3) {
              for (const entityId of Object.keys(ctx.read.env.entitiesById)) {
                const entity = ctx.read.getEntity(entityId);
                if (entity?.type === "operator") {
                  yield ctx.emit.buffApply({
                    sourceId: ctx.sourceId!,
                    targetId: entityId,
                    buffId: "buff.common.atkIncRatio",
                    buffKey: RARE_FIN_TEAM_ATK_BUFF_KEY,
                    durationFrames: RARE_FIN_TEAM_ATK_BUFF_DURATION_FRAMES,
                    maxStacks: 1,
                    runtime: {
                      value: RARE_FIN_TEAM_ATK_BUFF_RATIO,
                      role: "source",
                    },
                  });
                }
              }
            }
          },
        },
        ultimate: {
          name: "One Monster Catch!",
          durationFrames: 192,
          icon: "ALESH_ULT.png",
          script: function* (ctx) {
            yield delay(180);
            const potentialRank = Number(
              ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0,
            );
            let dmgMultiplier = ctx.byRank!(r => ULT_DMG_MUL[r] ?? 0);
            if (potentialRank >= 5) {
              const target = ctx.read.getEntity(ctx.targetId ?? null);
              const targetHpPercent =
                ((target as any)?.hp ?? 0) / ((target as any)?.maxHp ?? 1);
              if (targetHpPercent < 0.5) {
                dmgMultiplier *= 1.5;
              }
            }

            yield ctx.emit.inflictionApply({
              inflictionType: "cryo",
              inflictionStacks: 2,
            });
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier,
              staggerOnHit: 20,
            });
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(
    _potentialRank?: number,
  ): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(potentialRank?: number): number {
    const baseCost = 100;
    if (potentialRank && potentialRank >= 4) {
      return Math.floor(baseCost * 0.85);
    }
    return baseCost;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 6.5;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    registry.registerOnBuffApply({
      id: "operator.alesh.talent.energyOnSolidification",
      when: { buffId: "buff.solidification" },
      fn: function* ({ read, ev, emit, sourceId }) {
        if (ev?.type !== "buffApply") return;
        if (!read.env.entitiesById[selfId]) return;

        const isAppliedByAlesh = sourceId === selfId;
        const baseEnergy = isAppliedByAlesh ? 12 : 6;

        yield emit.spRecover({
          sourceId: selfId,
          amount: baseEnergy,
        });
      },
    });

    registry.registerOnBuffApply({
      id: "operator.alesh.talent.energyOnCrystal",
      when: { buffId: "buff.crystal" },
      fn: function* ({ read, ev, emit, sourceId }) {
        if (ev?.type !== "buffApply") return;
        if (!read.env.entitiesById[selfId]) return;

        const isAppliedByAlesh = sourceId === selfId;
        const baseEnergy = isAppliedByAlesh ? 12 : 6;

        yield emit.spRecover({
          sourceId: selfId,
          amount: baseEnergy,
        });
      },
    });
  }
}

export default new AleshDef();
