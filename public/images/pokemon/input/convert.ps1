$sourceDir = "."
$outputDir = ".\output"

if (-not (Test-Path $outputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Get-ChildItem -Path $outputDir -Include *.* -File -Recurse | foreach { $_.Delete()}

Get-ChildItem -Path "$sourceDir\*.png" | ForEach-Object {
    $fileName = $_.BaseName
    $destinationDir = $outputDir
	
		magick.exe convert -trim $_.FullName $_.FullName

		if ($fileName -match "^[0-9]+fsb-?") {
			$destinationDir = Join-Path $outputDir "back\shiny\female"
		}
    elseif ($fileName -match "^[0-9]+sb-?") {
			$destinationDir = Join-Path $outputDir "back\shiny"
    }
		elseif ($fileName -match "^[0-9]+fb-?") {
			$destinationDir = Join-Path $outputDir "back\female"
		}
    elseif ($fileName -match "^[0-9]+b-?") {
			$destinationDir = Join-Path $outputDir "back"
    }
		elseif ($fileName -match "^[0-9]+fs-?") {
			$destinationDir = Join-Path $outputDir "shiny\female"
		}
    elseif ($fileName -match "^[0-9]+s-?") {
			$destinationDir = Join-Path $outputDir "shiny"
    }
		elseif ($fileName -match "^[0-9]+f-?") {
			$destinationDir = Join-Path $outputDir "female"
		}

    if (-not (Test-Path $destinationDir -PathType Container)) {
        New-Item -ItemType Directory -Path $destinationDir | Out-Null
    }

    Move-Item -Path $_.FullName -Destination $destinationDir
    Write-Host "Moved: $($_.FullName) to $destinationDir"
}

$dirs = @(".\output\back\shiny\female", ".\output\back\shiny", ".\output\back\female", ".\output\back", ".\output\shiny\female", ".\output\shiny", ".\output\female")

foreach ($dir in $dirs) {
	Get-ChildItem -Path $dir -Filter *.png | ForEach-Object {
		$filename = $_.BaseName
		$extension = $_.Extension
		$newfilename = ""

		$prefix, $suffix = $filename -split '-', 2
		
		if ($suffix) {
			$suffix = '-' + $suffix
		}

		$prefix = $prefix -replace 'b|s|sb|f|fb|fs|fsb'

		$newfilename = "$prefix$suffix$extension"

		if ($filename -ne $newfilename) {
			Rename-Item $_.FullName -NewName $newfilename
			Write-Host "Renamed: $($_.FullName) to $newfilename"
		}
	}
}

$env:PATH = "C:\Program Files\CodeAndWeb\TexturePacker\bin;$env:PATH"

$dirs = @(".\output", ".\output\back\shiny\female", ".\output\back\shiny", ".\output\back\female", ".\output\back", ".\output\shiny\female", ".\output\shiny", ".\output\female")

foreach ($dir in $dirs) {
	Get-ChildItem $dir -Filter *.png | ForEach-Object {
		$outputDir = Join-Path $_.Directory $_.BaseName
		New-Item -ItemType Directory -Path $outputDir | Out-Null
		ffmpeg -i $_.FullName "$outputDir\%04d.png"
	}
}

foreach ($dir in $dirs) {
	Get-ChildItem -Path $dir -Directory | Where-Object { $_.Name -match '^[0-9]+' } | ForEach-Object {
		$name = $_.BaseName
		Get-ChildItem -Path $_.FullName -Recurse -File | ForEach-Object {
			$imagePath = Join-Path $dir "$($name).png"
			$jsonPath = Join-Path $dir "$($name).json"
			& TexturePacker.exe .\configuration.tps --sheet $imagePath --data $jsonPath $_.FullName
		}
	}
	
	$folders = Get-ChildItem -Path $dir -Directory

	$foldersToKeep = @('back', 'shiny', 'female')
	
	$foldersToDelete = $folders | Where-Object { $foldersToKeep -notcontains $_.Name }

	foreach ($folder in $foldersToDelete) {
		Remove-Item -Path $folder.FullName -Recurse -Force
		Write-Host "Deleted folder: $($folder.FullName)"
	}
}