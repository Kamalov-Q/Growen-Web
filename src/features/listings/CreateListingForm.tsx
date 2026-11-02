"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Field } from "@/src/components/ui/Field";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import { amenityName, categoryName, type Amenity, type Category } from "./api";
import type { Ring } from "./geo-ring";
import { closeRing, ringAreaM2 } from "./geo-ring";
import type { LocMode } from "./ShapePicker";
import { enumLabel } from "@/src/i18n/dictionary";
import {
  createListing,
  uploadImages,
  type CreateListingInput,
  type UploadedImage,
} from "./create-api";

// MapLibre touches `window` at import time, so it cannot server-render, and
// it is the heaviest dependency here. Loaded when the form is.
const ShapePicker = dynamic(
  () => import("./ShapePicker").then((m) => m.ShapePicker),
  {
    ssr: false,
    loading: () => <div className="h-80 animate-pulse rounded-card bg-muted-bg" />,
  },
);

const SELLER_TYPES = ["OWNER", "REALTOR"] as const;
const BUILDING_TYPES = ["NEW", "SECONDARY"] as const;
const REPAIR_TYPES = [
  "NEEDS_REPAIR",
  "AVERAGE",
  "COSMETIC",
  "EURO",
  "DESIGNER",
  "CAPITAL",
] as const;

const PURPOSES = [
  { id: "SALE", key: "home.purposeSale" },
  { id: "RENT_MONTHLY", key: "home.purposeRent" },
  { id: "RENT_DAILY", key: "home.purposeDaily" },
] as const;

const MAX_PHOTOS = 10;

/**
 * Posting a listing.
 *
 * ── The order of operations ───────────────────────────────────────────────
 *
 * Photos upload FIRST, then the listing is created with their URLs. The
 * reverse — create, then attach — leaves a listing with no photos on screen
 * if the upload fails, which is the worst of both: a live advert nobody will
 * click and an owner who thinks they posted pictures.
 *
 * ── What it does not do ───────────────────────────────────────────────────
 *
 * The app lets an owner trace a polygon and attach videos and amenities.
 * This posts a pin, photos and the fields the API marks required plus the
 * common optional ones. Everything here WORKS; the rest is editable in the
 * app rather than half-present here.
 */
export function CreateListingForm({
  lang,
  categories,
  amenities,
}: {
  lang: Lang;
  categories: Category[];
  amenities: Amenity[];
}) {
  const router = useRouter();
  const { user } = useSession();
  const fileInput = useRef<HTMLInputElement>(null);

  const [purpose, setPurpose] = useState<CreateListingInput["purpose"]>("SALE");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"USD" | "UZS">("USD");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [address, setAddress] = useState("");
  /**
   * Stored as the 9 digits AFTER the country code, which is what the field
   * shows beside its fixed "+998".
   *
   * The session's number arrives as "+998931004027". Stripping a leading
   * "998" from that leaves the "+" in place, so the field rendered
   * "+998931004027" next to the prefix and the box read "+998 +998931004027".
   * Normalising once, here, is the fix: take the digits, drop the country
   * code, keep the rest.
   */
  const [phone, setPhone] = useState(() =>
    (user?.phoneNumber ?? "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9),
  );
  const [area, setArea] = useState("");
  const [sellerType, setSellerType] = useState<string>("");
  const [buildingType, setBuildingType] = useState<string>("");
  const [repairType, setRepairType] = useState<string>("");
  const [properties, setProperties] = useState<string[]>([]);
  const [hasFloors, setHasFloors] = useState(true);

  /**
   * Which questions the chosen category asks.
   *
   * The server REFUSES a value for a question a category does not ask — a
   * floor on a plot of land is rejected, not ignored — so a hidden field
   * must also be an unsent one. The flags come from the category row, set
   * per category by an admin, exactly as the app reads them.
   */
  const chosen = categories.find((c) => c.slug === category) ?? null;
  const showBuildingType = chosen?.buildingTypeCapable ?? false;
  const showRepairType = chosen?.repairTypeCapable ?? false;
  const showFloors = chosen?.floorCapable ?? false;
  // Floors are only sent when the category has them AND the owner says this
  // particular property does — a one-storey shop in a floor-capable
  // category is a real case.
  const sendFloors = showFloors && hasFloors;

  const [locMode, setLocMode] = useState<LocMode>("PIN");
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [ring, setRing] = useState<Ring>([]);

  /**
   * The drawn area, pre-filled into the field but never forced.
   *
   * The owner may know the registered figure differs from what they traced,
   * so the measurement seeds the input and they can overwrite it. Sending
   * nothing is also fine — the server measures the boundary itself.
   */
  const measured =
    locMode === "POLYGON" && ring.length >= 3 ? Math.round(ringAreaM2(ring)) : 0;
  const areaValue = area || (measured ? String(measured) : "");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [busy, setBusy] = useState<null | "upload" | "create">(null);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)].slice(0, MAX_PHOTOS);
    setFiles(next);
    // Object URLs are revoked when a photo is removed and on submit; holding
    // them for the life of the form is what lets the thumbnails render at
    // all without a second read of each file.
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    const url = previews[i];
    if (url) URL.revokeObjectURL(url);
    const next = files.filter((_, n) => n !== i);
    setFiles(next);
    setPreviews(previews.filter((_, n) => n !== i));
  };

  const num = (v: string) => {
    const n = Number(v.replace(/\s/g, ""));
    return v.trim() && Number.isFinite(n) ? n : undefined;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) return setError(t(lang, "create.needCategory"));
    const priceNum = num(price);
    if (priceNum === undefined || priceNum <= 0) {
      return setError(t(lang, "create.needPrice"));
    }
    // A listing with no location is one nobody can find on the map, which
    // is most of how this site is browsed.
    if (locMode === "PIN" && !point) return setError(t(lang, "create.needShape"));
    if (locMode === "POLYGON" && ring.length < 3) {
      return setError(t(lang, "create.needRing"));
    }

    try {
      let images: UploadedImage[] = [];
      if (files.length) {
        setBusy("upload");
        const res = await uploadImages(files);
        images = res.images;
        // A partial failure is reported but does not abort: losing one photo
        // is not a reason to throw away everything they typed.
        if (res.failed.length) setError(t(lang, "create.uploadFailed"));
      }

      setBusy("create");
      const listing = await createListing({
        purpose,
        price: priceNum,
        currency,
        category,
        offers: [{ purpose, price: priceNum, currency }],
        title: title.trim() || undefined,
        descriptionHtml: description.trim()
          ? `<p>${description.trim().replace(/[<>&]/g, (c) =>
              c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
            )}</p>`
          : undefined,
        rooms: num(rooms),
        floor: sendFloors ? num(floor) : undefined,
        totalFloors: sendFloors ? num(totalFloors) : undefined,
        address: address.trim() || undefined,
        contactPhone: phone ? `998${phone}` : undefined,
        sellerType: sellerType || undefined,
        buildingType: (showBuildingType && buildingType) || undefined,
        repairType: (showRepairType && repairType) || undefined,
        ...(properties.length ? { properties } : {}),
        ...(areaValue ? { areaM2: Number(areaValue) } : {}),
        // One or the other, never both: the server reads whichever arrives
        // and sending two shapes would leave it to choose.
        ...(locMode === "POLYGON"
          ? { coordinates: [closeRing(ring)] }
          : { point: point! }),
        images: images.map((img) => ({
          url: img.url,
          thumbUrl: img.thumbUrl,
          width: img.width,
          height: img.height,
        })),
      });

      previews.forEach((u) => URL.revokeObjectURL(u));
      router.push(`/${lang}/listing/${listing.id}`);
    } catch {
      setError(t(lang, "create.failed"));
      setBusy(null);
    }
  };

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-[14px] font-semibold transition ${
      active
        ? "bg-brand text-brand-ink"
        : "bg-raised text-ink ring-1 ring-line hover:ring-line-strong"
    }`;

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Section title={t(lang, "create.basics")}>
        <div className="grid grid-cols-3 gap-1 rounded-control bg-muted-bg p-1">
          {PURPOSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPurpose(p.id)}
              aria-pressed={purpose === p.id}
              className={`rounded-[0.5rem] px-3 py-2.5 text-[14px] font-semibold transition ${
                purpose === p.id
                  ? "bg-brand text-brand-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t(lang, p.key)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={chip(category === c.slug)}
            >
              {categoryName(c, lang)}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label={t(lang, "create.price")}
            placeholder={t(lang, "create.phPrice")}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="nums"
            />
          </div>
          <div className="flex gap-1 rounded-control bg-muted-bg p-1">
            {(["USD", "UZS"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`rounded-[0.5rem] px-3 py-2.5 text-[14px] font-semibold transition ${
                  currency === c
                    ? "bg-brand text-brand-ink shadow-card"
                    : "text-muted hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Field
          label={t(lang, "create.titleField")}
            placeholder={t(lang, "create.phTitle")}
          value={title}
          maxLength={160}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Section>

      <Section title={t(lang, "create.photos")} note={t(lang, "create.photoHint")}>
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div
              key={src}
              className="relative size-24 overflow-hidden rounded-control ring-1 ring-line"
            >
              {/* A blob: URL from the local file — `next/image` cannot
                  optimize what it cannot fetch, so a plain <img> is right. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={t(lang, "create.remove")}
                className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
              >
                ✕
              </button>
              {i === 0 ? (
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-bold uppercase text-white">
                  1
                </span>
              ) : null}
            </div>
          ))}

          {files.length < MAX_PHOTOS ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="grid size-24 place-items-center rounded-control bg-raised text-[13px] font-semibold text-muted ring-1 ring-dashed ring-line-strong transition hover:text-ink"
            >
              + {t(lang, "create.addPhotos")}
            </button>
          ) : null}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            // Reset so picking the same file twice still fires change.
            e.target.value = "";
          }}
        />
      </Section>

      <Section title={t(lang, "create.location")}>
        <Field
          label={t(lang, "create.address")}
            placeholder={t(lang, "create.phAddress")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-1 rounded-control bg-muted-bg p-1">
          {(["PIN", "POLYGON"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLocMode(m)}
              aria-pressed={locMode === m}
              className={`rounded-[0.5rem] px-3 py-2.5 text-[14px] font-semibold transition ${
                locMode === m
                  ? "bg-brand text-brand-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t(lang, m === "PIN" ? "create.modePin" : "create.modePolygon")}
            </button>
          ))}
        </div>

        <ShapePicker
          lang={lang}
          mode={locMode}
          point={point}
          ring={ring}
          onPoint={setPoint}
          onRing={setRing}
        />
      </Section>

      <Section title={t(lang, "create.details")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t(lang, "create.area")}
            placeholder={t(lang, "create.phArea")}
            inputMode="numeric"
            value={areaValue}
            onChange={(e) => setArea(e.target.value)}
            className="nums"
          />
          <div className="flex items-end pb-3">
            {measured && !area ? (
              <p className="text-[13px] text-faint">
                {t(lang, "create.areaHint")}
              </p>
            ) : null}
          </div>
        </div>

        <EnumRow
          label={t(lang, "create.sellerType")}
          options={SELLER_TYPES}
          kind="seller"
          value={sellerType}
          onChange={setSellerType}
          lang={lang}
        />
        {showBuildingType ? (
          <EnumRow
            label={t(lang, "create.buildingType")}
            options={BUILDING_TYPES}
            kind="building"
            value={buildingType}
            onChange={setBuildingType}
            lang={lang}
          />
        ) : null}
        {showRepairType ? (
          <EnumRow
            label={t(lang, "create.repairType")}
            options={REPAIR_TYPES}
            kind="repair"
            value={repairType}
            onChange={setRepairType}
            lang={lang}
          />
        ) : null}

        {amenities.length ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">
              {t(lang, "create.properties")}
            </span>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const on = properties.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setProperties((prev) =>
                        on
                          ? prev.filter((k) => k !== a.key)
                          : [...prev, a.key],
                      )
                    }
                    className={chip(on)}
                  >
                    {amenityName(a, lang)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {showFloors ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">
              {t(lang, "create.floorsQuestion")}
            </span>
            <div className="flex gap-2">
              {[true, false].map((yes) => (
                <button
                  key={String(yes)}
                  type="button"
                  aria-pressed={hasFloors === yes}
                  onClick={() => setHasFloors(yes)}
                  className={chip(hasFloors === yes)}
                >
                  {t(lang, yes ? "create.hasFloors" : "create.noFloors")}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={`grid gap-3 ${sendFloors ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}
        >
          <Field
            label={t(lang, "create.rooms")}
            placeholder={t(lang, "create.phRooms")}
            inputMode="numeric"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="nums"
          />
          {/* Only when the category has floors and the owner says this
              property does. Hidden means unsent — see `sendFloors`. */}
          {sendFloors ? (
            <>
              <Field
                label={t(lang, "create.floor")}
                placeholder={t(lang, "create.phFloor")}
                inputMode="numeric"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="nums"
              />
              <Field
                label={t(lang, "create.totalFloors")}
                placeholder={t(lang, "create.phTotalFloors")}
                inputMode="numeric"
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                className="nums"
              />
            </>
          ) : null}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">
            {t(lang, "create.description")}
          </span>
          <textarea
            placeholder={t(lang, "create.phDescription")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-control bg-surface px-3.5 py-3 text-[15px] text-ink ring-1 ring-line outline-none transition focus:ring-2 focus:ring-brand placeholder:text-faint"
          />
        </label>
      </Section>

      <Section title={t(lang, "create.contact")}>
        <Field
          label={t(lang, "create.phone")}
          prefix="+998"
          inputMode="tel"
          maxLength={9}
          placeholder={t(lang, "create.phPhone")}
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
          }
          className="nums"
        />
      </Section>

      {error ? (
        <p role="alert" className="text-[14px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy !== null}
        className="h-13 rounded-control bg-brand px-5 py-4 text-[15px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-60"
      >
        {busy === "upload"
          ? t(lang, "create.uploading")
          : busy === "create"
            ? t(lang, "create.submitting")
            : t(lang, "create.submit")}
      </button>
    </form>
  );
}

/**
 * One row of mutually exclusive enum chips, with a clear option.
 *
 * Every one of these is OPTIONAL on the server, so each row can be
 * un-answered — pressing the selected chip again clears it. A required-
 * looking control for an optional field is how forms collect guesses.
 */
function EnumRow({
  label,
  options,
  kind,
  value,
  onChange,
  lang,
}: {
  label: string;
  options: readonly string[];
  kind: "seller" | "building" | "repair";
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "" : o)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold transition ${
                on
                  ? "bg-brand text-brand-ink"
                  : "bg-raised text-ink ring-1 ring-line hover:ring-line-strong"
              }`}
            >
              {enumLabel(lang, kind, o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
      {note ? <p className="text-[13px] text-faint">{note}</p> : null}
    </section>
  );
}
