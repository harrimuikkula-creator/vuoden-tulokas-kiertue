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
    text: "Energiaa, yllätyksiä ja lavakemiaa — juuri sitä, mitä stand up -kiertueelta toivoo.",
    attribution: "Placeholder-arvostelu",
    placeholder: true,
  },
  {
    id: "q2",
    text: "Seitsemän erilaista ääntä samalla illalla. Nauru ei lopu kesken.",
    attribution: "Placeholder-arvostelu",
    placeholder: true,
  },
  {
    id: "q3",
    text: "Kiertue, jota kannattaa seurata — sekä uusille tulokkaille että stand up -faneille.",
    attribution: "Placeholder-arvostelu",
    placeholder: true,
  },
];
