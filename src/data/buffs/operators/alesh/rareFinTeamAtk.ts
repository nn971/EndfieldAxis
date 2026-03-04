import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

const ALESH_RARE_FIN_TEAM_ATK_BUFF_ID = "buff.alesh.rareFin.teamAtk" as const;
const ALESH_RARE_FIN_TEAM_ATK_DURATION_FRAMES = 600;
const ALESH_RARE_FIN_TEAM_ATK_RATIO = 0.15;

class AleshRareFinTeamAtkBuffDef extends BuffDef {
  constructor() {
    super({
      id: ALESH_RARE_FIN_TEAM_ATK_BUFF_ID,
      name: "Rare Fin Team ATK Buff",
      icon: "ALESH_CS.png",
      durationFrames: ALESH_RARE_FIN_TEAM_ATK_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector }) => {
        if (role !== "source") return;
        collector.addValue(
          "atkIncRatio",
          ALESH_RARE_FIN_TEAM_ATK_RATIO,
          "Rare Fin Team ATK(+15% ATK)",
        );
      },
    });
  }
}

export default new AleshRareFinTeamAtkBuffDef();
export { ALESH_RARE_FIN_TEAM_ATK_BUFF_ID };
