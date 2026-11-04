import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { getTransactions, type WalletTxn } from "@/src/features/account/api";
import { txConfig } from "./txConfig";

/**
 * The ledger, as a spreadsheet.
 *
 * A phone has nowhere useful to put a file; a browser does, which is why
 * this exists here and not in the app. What somebody downloading this
 * actually wants is to reconcile it against an accounting entry, so the
 * rows carry the raw ISO timestamp and the unformatted amount alongside
 * the readable label — a column of "1 000" with a non-breaking space in it
 * is not a number any spreadsheet will sum.
 */

/**
 * One request per page, until the server says there are no more.
 *
 * 50 because that is the server's own ceiling (`PageQueryDto` caps `limit`
 * at 50) — asking for 100 came back 400 "limit must not be greater than
 * 50" and the export failed before it had written a line.
 */
const PAGE = 50;
/** A guard, not a limit: 100 pages is 5 000 lines and nobody's ledger. */
const MAX_PAGES = 100;

export async function fetchAllTransactions(): Promise<WalletTxn[]> {
  const all: WalletTxn[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { items, total } = await getTransactions(PAGE, page * PAGE);
    all.push(...items);
    if (all.length >= total || items.length < PAGE) break;
  }

  return all;
}

/**
 * RFC 4180 quoting: every field is wrapped and its own quotes doubled.
 *
 * Unconditional rather than "only when it contains a comma" — a note
 * carrying a semicolon, a newline or a leading `=` is the difference
 * between a column and a corrupted file, and Excel reads `=cmd` as a
 * formula if it is handed one bare.
 */
const cell = (value: string | number | null | undefined): string =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export function toCsv(rows: WalletTxn[], lang: Lang): string {
  const header = [
    t(lang, "wallet.fieldDate"),
    t(lang, "wallet.fieldType"),
    t(lang, "wallet.fieldAmount"),
    t(lang, "wallet.fieldBalanceAfter"),
    t(lang, "wallet.fieldNote"),
    t(lang, "wallet.fieldTransactionId"),
  ];

  const lines = rows.map((tx) =>
    [
      // ISO, not the pretty form: a spreadsheet can parse this one.
      tx.createdAt,
      t(lang, txConfig(tx.kind, Number(tx.amount)).label),
      tx.amount,
      tx.balanceAfter,
      tx.note ?? "",
      tx.id,
    ]
      .map(cell)
      .join(","),
  );

  /**
   * A BOM, and CRLF.
   *
   * Excel on Windows reads a UTF-8 file as the local 8-bit codepage unless
   * it starts with a byte-order mark — which turns "To'ldirish" into
   * mojibake and is the single most common complaint about exported CSVs
   * in this part of the world. CRLF is what the format specifies.
   */
  return `﻿${[header.map(cell).join(","), ...lines].join("\r\n")}\r\n`;
}

/** Hands the browser a file. Revoked immediately: the download has it. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
