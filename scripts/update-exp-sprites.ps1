[string[]] $keys = @()

Get-ChildItem -Path '.\public\images\pokemon' -Recurse -Directory | Where-Object { $_.Name -eq 'exp' } | ForEach-Object {
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

$keys | ConvertTo-Json | Out-File -encoding ASCII .\public\exp-sprites.json