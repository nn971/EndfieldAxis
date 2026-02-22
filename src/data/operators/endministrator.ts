import { applyBuff, physicalHit } from "../../simulator/skillOps";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

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
            physicalHit(24, {
              dmgMultiplier: 2.8,
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
            physicalHit(45, { dmgMultiplier: 0.8, withStatus: false }),
          ],
        },
        ultimate: {
          name: "Bombardment Sequence",
          durationFrames: 110,
          icon: "ENDMINISTRATOR_ULT.png",
        },
      },
    } satisfies OperatorDefInit);
  }

  override registerSimPlugins(registry: any): void {
    // No unique plugins for Endministrator as of now.
  }
}

export default new EndministratorDef();
