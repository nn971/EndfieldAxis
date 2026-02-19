import { SimEvent } from "../../types/sim/simulator";
import { compileSkillCast } from "../../sim/compiler";

export function TEMPgetZerothTestCaseEvents(nextSeq: () => number): SimEvent[] {
  const firstSkill = compileSkillCast({
    sourceId: "endministrator",
    skillType: "normalSkill",
    targetId: "enemy1",
    startFrame: 0,
    nextSeq,
  });
  return [...firstSkill];
}

export function TEMPgetFirstTestCaseEvents(nextSeq: () => number): SimEvent[] {
  // Cast Endministrator normal skill two times at frame 0, 100.
  const firstSkill = compileSkillCast({
    sourceId: "endministrator",
    skillType: "normalSkill",
    targetId: "enemy1",
    startFrame: 0,
    nextSeq,
  });
  const secondSkill = compileSkillCast({
    sourceId: "endministrator",
    skillType: "normalSkill",
    targetId: "enemy1",
    startFrame: 100,
    nextSeq,
  });
  return [...firstSkill, ...secondSkill];
}

export function TEMPgetSecondTestCaseEvents(nextSeq: () => number): SimEvent[] {
  // Cast Chenqianyu normal skill at frame 0, combo skill at frame 100.
  // Cast Endministrator combo skill at frame 200, normal skill at frame 300.
  const chenqianyuNormal = compileSkillCast({
    sourceId: "chenqianyu",
    skillType: "normalSkill",
    targetId: "enemy1",
    startFrame: 0,
    nextSeq,
  });
  const chenqianyuCombo = compileSkillCast({
    sourceId: "chenqianyu",
    skillType: "comboSkill",
    targetId: "enemy1",
    startFrame: 100,
    nextSeq,
  });
  const endministratorCombo = compileSkillCast({
    sourceId: "endministrator",
    skillType: "comboSkill",
    targetId: "enemy1",
    startFrame: 200,
    nextSeq,
  });
  const endministratorNormal = compileSkillCast({
    sourceId: "endministrator",
    skillType: "normalSkill",
    targetId: "enemy1",
    startFrame: 300,
    nextSeq,
  });
  return [
    ...chenqianyuNormal,
    ...chenqianyuCombo,
    ...endministratorCombo,
    ...endministratorNormal,
  ];
}
