/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** An option selected by the user in the egg moves CLI. */
export type Option = { type: "Console" | "File"; value: string } | { type: "Exit" };
