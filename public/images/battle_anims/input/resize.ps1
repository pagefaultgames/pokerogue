Get-ChildItem -Path "*.png" | ForEach-Object {
	magick.exe convert $_.FullName -interpolate Integer -filter point -resize "50%" $_.FullName
}