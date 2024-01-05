$sourceDir = "."
$outputDir = ".\output"

if (-not (Test-Path $outputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Get-ChildItem -Path $outputDir -Include *.* -File -Recurse | foreach { $_.Delete()}

Get-ChildItem -Path "$sourceDir\*.webp" | ForEach-Object {
    $destinationDir = $outputDir
	
	magick.exe mogrify -format PNG $_.FullName
}

Get-ChildItem -Path "$sourceDir\*.png" | ForEach-Object {
    $destinationDir = $outputDir
	
	magick.exe convert -trim $_.FullName $_.FullName

    if (-not (Test-Path $destinationDir -PathType Container)) {
        New-Item -ItemType Directory -Path $destinationDir | Out-Null
    }

    Move-Item -Path $_.FullName -Destination $destinationDir
    Write-Host "Moved: $($_.FullName) to $destinationDir"
}

$env:PATH = "C:\Program Files\CodeAndWeb\TexturePacker\bin;$env:PATH"

$dirs = @(".\output")

foreach ($dir in $dirs) {
	Get-ChildItem $dir -Filter *.png | ForEach-Object {
		$outputDir = Join-Path $_.Directory $_.BaseName
		New-Item -ItemType Directory -Path $outputDir | Out-Null
		ffmpeg -i $_.FullName "$outputDir\%04d.png"
	}
}

foreach ($dir in $dirs) {
	Get-ChildItem -Path $dir -Directory | ForEach-Object {
		$name = $_.BaseName
		Get-ChildItem -Path $_.FullName -Recurse -File | ForEach-Object {
			$imagePath = Join-Path $dir "$($name).png"
			$jsonPath = Join-Path $dir "$($name).json"
			& TexturePacker.exe .\configuration.tps --sheet $imagePath --data $jsonPath $_.FullName
		}
	}
	
	$folders = Get-ChildItem -Path $dir -Directory
	
	$foldersToDelete = $folders

	foreach ($folder in $foldersToDelete) {
		Remove-Item -Path $folder.FullName -Recurse -Force
		Write-Host "Deleted folder: $($folder.FullName)"
	}
}