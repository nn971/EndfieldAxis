import type { SimRegistry } from "../../simulator/listeners/registry";
import { artsHitByRank, physicalHitByRank } from "../../simulator/skillOps";
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
          timeline: [
            artsHitByRank(26, {
              rankTable: NS_DMG_MUL,
              dmgType: "cryo",
              withInfliction: true,
            }),
          ],
        },
        comboSkill: {
          name: "Distortion",
          durationFrames: 52,
          icon: "ESTELLA_CS.png",
          // TODO: currently simulator does not support conditional skill multipliers
          // by target state (solidification / physical susceptibility) natively.
          timeline: [
            physicalHitByRank(34, {
              rankTable: CS_DMG_MUL_NON_SOLIDIFIED,
              withStatus: true,
              statusType: "lift",
            }),
          ],
        },
        ultimate: {
          name: "Tremolo",
          durationFrames: 110,
          icon: "ESTELLA_ULT.png",
          // TODO: Lift should apply only when target has physical susceptibility.
          timeline: [
            physicalHitByRank(55, {
              rankTable: ULT_DMG_MUL,
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
    return 130;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 9;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerOnBuffApply({
      id: "operator.estella.combo.triggerOnSolidification",
      when: { buffId: "buff.solidification" },
      fn: ({ read, ev, emit }) => {
        if (!read.env.entitiesById[this.id]) return [];

        return [
          emit.now({
            type: "comboTriggered",
            sourceId: this.id,
            targetId: ev.ownerId,
            ref: ev.id,
          }),
        ];
      },
    });

    // Keep both tables close to the definition until conditional combo damage
    // by target state is implemented in the simulator.
    void CS_DMG_MUL_SOLIDIFIED;
  }
}

export default new EstellaDef();
