import { applyBuff, physicalHit } from "../../simulator/skillOps";
import { OperatorDefClass, OperatorDefInit } from "./OperatorDefClass";

export default new OperatorDefClass({
  id: "endministrator",
  name: "Endministrator",
  avatar: "ENDMINISTRATOR.png",
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
        applyBuff(45, "crystal"),
        physicalHit(45, { dmgMultiplier: 0.8, withStatus: false }),
      ],
    },
    ultimate: {
      name: "Bombardment Sequence",
      durationFrames: 110,
      icon: "ENDMINISTRATOR_ULT.png",
    },
  },
  attributes: {
    main: "strength",
    sub: "agility",
  },
  stats: {
    level1: {
      attack: 319,
      strength: 0,
      agility: 0,
      intellect: 0,
      will: 0,
    },
    level90: {
      attack: 319,
      strength: 0,
      agility: 0,
      intellect: 0,
      will: 0,
    },
  },
} satisfies OperatorDefInit);
