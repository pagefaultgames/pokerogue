# SPDX-FileCopyrightText: 2024-2025 Pagefault Games
# SPDX-FileContributor: FlashfyreDev
#
# SPDX-License-Identifier: AGPL-3.0-only

Get-ChildItem -Path "*.png" | ForEach-Object {
	magick.exe convert $_.FullName -interpolate Integer -filter point -resize "50%" $_.FullName
}