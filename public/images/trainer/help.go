package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	// Define the string to search for and remove
	searchString := ""

	// Get the current directory
	dir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting current directory:", err)
		return
	}

	// Read the directory contents
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return
	}

	// Iterate over each file in the directory
	for _, file := range files {
		// Skip directories
		if file.IsDir() {
			continue
		}

		filePath := filepath.Join(dir, file.Name())

		// Read the file content
		content, err := ioutil.ReadFile(filePath)
		if err != nil {
			fmt.Println("Error reading file:", filePath, err)
			continue
		}

		// Replace the search string in the file content
		updatedContent := strings.ReplaceAll(string(content), searchString, "")

		// Write the updated content back to the file
		err = ioutil.WriteFile(filePath, []byte(updatedContent), file.Mode())
		if err != nil {
			fmt.Println("Error writing file:", filePath, err)
			continue
		}

		// Check if the search string is in the filename
		if strings.Contains(file.Name(), searchString) {
			// Create the new filename
			newFileName := strings.ReplaceAll(file.Name(), searchString, "")
			newFilePath := filepath.Join(dir, newFileName)

			// Rename the file
			err = os.Rename(filePath, newFilePath)
			if err != nil {
				fmt.Println("Error renaming file:", filePath, err)
				continue
			}
		}
	}

	fmt.Println("Operation completed successfully.")
}
