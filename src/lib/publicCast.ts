import { comedians, type Comedian } from "@/data/comedians";

/**
 * Public web config for StandUppApp. The key is the same client key already
 * shipped in the app bundle; Firestore rules only allow this collection to be read.
 */
const FIREBASE_PROJECT = "standupapp2025";
const FIREBASE_API_KEY = "AIzaSyDHtXPw2fi0s1Rlga69VlgPWA44Jl3i9TM";

type FsValue = {
  stringValue?: string;
  arrayValue?: { values?: FsValue[] };
  mapValue?: { fields?: Record<string, FsValue> };
};

export type PublicCastVideo = { url: string; title?: string };

export type PublicCastSocials = Partial<
  Record<"instagram" | "facebook" | "tiktok" | "youtube" | "website", string>
>;

const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "youtube", "website"] as const;

export type PublicCastComedian = {
  name: string;
  slug?: string;
  bio?: string;
  photos: string[];
  videos: PublicCastVideo[];
  socials?: PublicCastSocials;
};

export type PublicCast = {
  title: string;
  updatedAt: string;
  comedians: PublicCastComedian[];
};

function field(map: FsValue | undefined, key: string): FsValue | undefined {
  return map?.mapValue?.fields?.[key];
}

function text(value: FsValue | undefined): string {
  return value?.stringValue?.trim() || "";
}

function list(value: FsValue | undefined): FsValue[] {
  return value?.arrayValue?.values || [];
}

function parseComedian(value: FsValue): PublicCastComedian | null {
  const name = text(field(value, "name"));
  if (!name) return null;
  const slug = text(field(value, "slug"));
  const bio = text(field(value, "bio"));
  const photos = list(field(value, "photos"))
    .map((item) => text(item))
    .filter(Boolean);
  const videos = list(field(value, "videos"))
    .map((item) => {
      const url = text(field(item, "url"));
      if (!url) return null;
      const title = text(field(item, "title"));
      return title ? { url, title } : { url };
    })
    .filter((item): item is PublicCastVideo => Boolean(item));
  const socialFields = field(value, "socials")?.mapValue?.fields;
  const socials: PublicCastSocials = {};
  if (socialFields) {
    for (const key of SOCIAL_KEYS) {
      const url = text(socialFields[key]);
      if (url) socials[key] = url;
    }
  }
  return {
    name,
    ...(slug ? { slug } : {}),
    ...(bio ? { bio } : {}),
    photos,
    videos,
    ...(Object.keys(socials).length ? { socials } : {}),
  };
}

function parseDocument(fields: Record<string, FsValue> | undefined): PublicCast | null {
  if (!fields) return null;
  const title = text(fields.title);
  if (!/vuoden\s*tulok/i.test(title)) return null;
  const comedians = list(fields.comedians)
    .map(parseComedian)
    .filter((person): person is PublicCastComedian => Boolean(person));
  return { title, updatedAt: text(fields.updatedAt), comedians };
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function applyPublicCast(base: Comedian[], cast: PublicCast | null): Comedian[] {
  if (!cast) return base;
  return base.map((person) => {
    const row = cast.comedians.find(
      (candidate) =>
        candidate.slug === person.id || normalizeName(candidate.name) === normalizeName(person.name),
    );
    if (!row) return person;
    const photo = row.photos.find(Boolean);
    const clips = row.videos.map((video) => video.url).filter(Boolean).slice(0, 2);
    const bio = row.bio?.trim();
    const socials = row.socials
      ? SOCIAL_KEYS.reduce<Comedian["socials"]>((links, key) => {
          const url = row.socials?.[key] || person.socials[key];
          if (url) links[key] = url;
          return links;
        }, {})
      : person.socials;
    return {
      ...person,
      ...(photo ? { photo, photos: [photo] } : {}),
      ...(bio ? { bio, placeholder: false } : {}),
      ...(clips.length ? { clips } : {}),
      socials,
    };
  });
}

function pickCast(documents: PublicCast[]): PublicCast | null {
  const ranked = documents
    .map((doc) => ({
      doc,
      score: /2026/.test(doc.title) ? 2 : 1,
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.doc.updatedAt.localeCompare(a.doc.updatedAt);
    });
  return ranked[0]?.doc ?? null;
}

export async function fetchPublicCast(): Promise<PublicCast | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/publicTourCast?pageSize=20&key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    documents?: Array<{ fields?: Record<string, FsValue> }>;
  };
  const parsed = (body.documents || [])
    .map((doc) => parseDocument(doc.fields))
    .filter((doc): doc is PublicCast => Boolean(doc));
  return pickCast(parsed);
}

export async function loadSiteComedians(): Promise<Comedian[]> {
  try {
    const cast = await fetchPublicCast();
    return applyPublicCast(comedians, cast);
  } catch {
    return comedians;
  }
}
