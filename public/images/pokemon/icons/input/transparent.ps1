Get-ChildItem -Path $dir -Filter *.png | ForEach-Object {
	magick.exe convert $_.FullName -alpha on -fill none -draw 'color 0,0 replace' $_.FullName
}