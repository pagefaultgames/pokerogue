Get-ChildItem -Path "*.png" | ForEach-Object {
	magick.exe convert -trim $_.FullName $_.FullName
}