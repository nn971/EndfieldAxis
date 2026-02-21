import { OperatorDefClass, OperatorDefInit } from "./OperatorDefClass";

export default new OperatorDefClass({
  id: "akekuri",
  name: "Akekuri",
  avatar: "AKEKURI.png",
  attributes: {
    main: "strength",
    sub: "agility",
  },
  stats: {
    level1: {
      attack: 0,
      strength: 0,
      agility: 0,
      intellect: 0,
      will: 0,
    },
    level90: {
      attack: 0,
      strength: 0,
      agility: 0,
      intellect: 0,
      will: 0,
    },
  },
  skills: {},
} satisfies OperatorDefInit);
