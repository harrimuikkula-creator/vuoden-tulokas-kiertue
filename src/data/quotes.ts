export type Quote = {
  id: string;
  text: string;
  attribution: string;
  placeholder?: boolean;
};

/** Placeholder reviews — replace with real press quotes when available. */
export const quotes: Quote[] = [
  {
    id: "q1",
    text: "LUONNOS Energiaa, yllätyksiä ja lavakemiaa — juuri sitä, mitä stand up -kiertueelta toivoo.",
    attribution: "LUONNOS Placeholder-arvostelu",
    placeholder: true,
  },
  {
    id: "q2",
    text: "LUONNOS Seitsemän erilaista ääntä samalla illalla. Nauru ei lopu kesken.",
    attribution: "LUONNOS Placeholder-arvostelu",
    placeholder: true,
  },
  {
    id: "q3",
    text: "LUONNOS Kiertue, jota kannattaa seurata — sekä uusille tulokkaille että stand up -faneille.",
    attribution: "LUONNOS Placeholder-arvostelu",
    placeholder: true,
  },
];
