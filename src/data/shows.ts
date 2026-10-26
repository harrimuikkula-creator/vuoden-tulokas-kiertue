export type Show = {
  id: string;
  date: string;
  /** ISO date for sorting / future tooling */
  dateIso: string;
  venue: string;
  city: string;
  ticketUrl: string | null;
};

export const shows: Show[] = [
  {
    id: "lohja-2027-04-21",
    date: "21.4.2027",
    dateIso: "2027-04-21",
    venue: "Opus K",
    city: "Lohja",
    ticketUrl: null,
  },
  {
    id: "helsinki-2027-05-08",
    date: "8.5.2027",
    dateIso: "2027-05-08",
    venue: "Kumpulan kylätalo",
    city: "Helsinki",
    ticketUrl: null,
  },
];
