export type SocialLinks = {
  instagram?: string;
  website?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
};

export type Comedian = {
  id: string;
  name: string;
  initials: string;
  photo: string | null;
  bio: string;
  socials: SocialLinks;
  /** YouTube watch or shorts URLs. Two slots are shown for every comedian. */
  clips: string[];
  placeholder: boolean;
};

function youtubeEmbedId(url: string): string | null {
  const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shorts) return shorts[1];
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch) return watch[1];
  const youtu = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtu) return youtu[1];
  return null;
}

export function clipToEmbedUrl(url: string): string | null {
  const id = youtubeEmbedId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

const placeholderBio =
  "LUONNOS Bio tulossa. Tämä koomikko on osa Vuoden Tulokas Stand Up -kiertuetta — tarina, linkit ja klipit päivitetään pian.";

/** Poster order: Joanna, Mister Habibi, Harri, Aino, Miikka, Minna, Samu */
export const comedians: Comedian[] = [
  {
    id: "joanna-ovaska",
    name: "Joanna Ovaska",
    initials: "JO",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
  {
    id: "mister-habibi",
    name: "Mister Habibi",
    initials: "MH",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
  {
    id: "harri-muikkula",
    name: "Harri Muikkula",
    initials: "HM",
    photo: "/harri-muikkula.jpg",
    bio: 'Harri on jalkansa Helsinkiin betonoinut oululainen koomikko, joka on lavalla kuin kotonaan: välillä terävä, välillä aivan ulapalla. Tämä kahden pienen lapsen isä ammentaa juttunsa loputtoman tuntuisten ruuhkavuosiensa arjestaan. Kun asiat eivät mene toivotusti, Harrin elämänasenne säilyy positiivisena: "no, ainakin tästä saa stand up -matskua!".',
    socials: {
      instagram: "https://www.instagram.com/harrimuikkula/",
      website: "https://www.harrimuikkula.fi",
      tiktok: "https://www.tiktok.com/@harrimuikkula",
      facebook: "https://www.facebook.com/profile.php?id=61564262994506",
      youtube: "https://www.youtube.com/@harrimuikkula2477",
    },
    clips: [
      "https://www.youtube.com/shorts/RelqXTqWrTA",
      "https://www.youtube.com/shorts/DuU4u8EAYJg",
    ],
    placeholder: false,
  },
  {
    id: "aino-saarinen",
    name: "Aino Saarinen",
    initials: "AS",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
  {
    id: "miikka-miinala",
    name: "Miikka Miinala",
    initials: "MM",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
  {
    id: "minna-tuominen",
    name: "Minna Tuominen",
    initials: "MT",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
  {
    id: "samu-voutilainen",
    name: "Samu Voutilainen",
    initials: "SV",
    photo: null,
    bio: placeholderBio,
    socials: {},
    clips: [],
    placeholder: true,
  },
];
