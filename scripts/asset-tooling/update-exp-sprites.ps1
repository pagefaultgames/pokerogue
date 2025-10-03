# SPDX-FileCopyrightText: 2024-2025 Pagefault Games
# SPDX-FileContributor: FlashfyreDev
#
# SPDX-License-Identifier: AGPL-3.0-only

[string[]] $keys = @()

Get-ChildItem -Path '.\assets\images\pokemon' -Recurse -Directory | Where-Object { $_.Name -eq 'exp' } | ForEach-Object {
	Get-ChildItem -Path $_.FullName -Recurse -File | ForEach-Object {
        $attr = ""
        if ($_.FullName.Contains('\shiny\')) {
            $attr += "s"
        }
        if ($_.FullName.Contains("\back\")) {
            $attr += "b"
        }
        if ($_.FullName.Contains("\female\")) {
            $attr += "f"
        }
        $keyParts = $_.BaseName.Split("-")
        $key = $keyParts[0] + $attr
        if ($keyParts[1]) {
            $key += "-" + $keyParts[1]
        }
        $keys += $key
    }
}

$keys | ConvertTo-Json | Out-File -encoding ASCII .\assets\exp-sprites.json