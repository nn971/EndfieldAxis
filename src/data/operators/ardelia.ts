import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Dolly Rush
const NS_DMG_MUL = [
  1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.20,
] as const;

// Combo Skill: Eruption Column
const CS_DMG_MUL = [
  0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.80, 0.86, 0.93, 1.00,
] as const;
const CS_EXPLOSION_DMG_MUL = [
  1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2.00, 2.14, 2.30, 2.50,
] as const;

// Ultimate: Wooly Party
const ULT_DMG_MUL = [
  2.31, 2.54, 2.77, 3.00, 3.23, 3.46, 3.69, 3.92, 4.15, 4.44, 4.79, 5.20,
] as const;

// Normal Attack: Rocky Whispers - 4 hits
const NA_HIT1_DMG_MUL = [
  0.30, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68,
] as const;
const NA_HIT2_DMG_MUL = [
  0.40, 0.44, 0.48, 0.52, 0.56, 0.60, 0.64, 0.68, 0.72, 0.77, 0.83, 0.90,
] as const;
const NA_HIT3_DMG_MUL = [
  0.53, 0.58, 0.63, 0.68, 0.74, 0.79, 0.84, 0.89, 0.95, 1.01, 1.09, 1.18,
] as const;
const NA_HIT4_DMG_MUL = [
  0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24,
] as const;

const CS_COOLDOWN_SECONDS = [
  18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17,
] as const;

class ArdeliaDef extends OperatorDef {
  constructor() {
    super({
      id: "ardelia",
      name: "Ardelia",
      avatar: "ARDELIA.png",
      attributes: {
        main: "intellect",
        sub: "will",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 9,
          agility: 9,
          intellect: 20,
          will: 15,
        },
        level90: {
          attack: 323,
          strength: 112,
          agility: 93,
          intellect: 145,
          will: 118,
        },
      },
      weaponType: "artsunit",
      skills: {
        normalAttack: {
          name: "Rocky Whispers",
          durationFrames: 250,
          icon: "ARDELIA_NA.png",
          staggerOnHit: 18,
          script: function* (ctx) {
            yield delay(42);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(42);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(48);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 18,
            });
          },
        },
        normalSkill: {
          name: "Dolly Rush",
          durationFrames: 85,
          icon: "ARDELIA_NS.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Eruption Column",
          durationFrames: 80,
          icon: "ARDELIA_CS.png",
          script: function* (ctx) {
            yield delay(30);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => CS_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(20);
            // Explosion deals half damage
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => CS_EXPLOSION_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Wooly Party",
          durationFrames: 110,
          icon: "ARDELIA_ULT.png",
          script: function* (ctx) {
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => ULT_DMG_MUL[r] ?? 0),
              staggerOnHit: 20,
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
    return 120;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    // Talent 1: Friendly Presence - Healing when using skills on multiple enemies
    registry.registerAfterHit({
      id: "operator.ardelia.talent1.friendlyPresence",
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "hit" || ev.sourceId !== selfId) return;
        // Check if hit multiple enemies (simplified - actual implementation needs hit count tracking)
        // Apply healing based on Will attribute
        yield emit.buffApply({
          sourceId: selfId,
          targetId: selfId,
          buffId: "buff.ardelia.talent1.healing",
        });
      },
    });
  }
}

export default new ArdeliaDef();
