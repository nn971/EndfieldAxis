import type { SimPluginRegisterFn } from "../../../../simulator/registry";
import chenqianyu from "../../../operators/chenqianyu";

export const register: SimPluginRegisterFn = registry => {
  chenqianyu.registerSimPlugins(registry);
};
