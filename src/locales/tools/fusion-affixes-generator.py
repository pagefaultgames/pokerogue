#This script produces the list of affixes (prefix and suffix) used to create the fusion names.
# Run it from the folder in which the pokemon.ts file is located, ex. "src\locales\de\"
# If the language doesn't use roman characters but uses an alphabet, it's possible to include the vowel/consonant characters to the script and use it's functionalities
# For ideographic languages, a different approach is needed. For now, the "universal-fusion-affixes-generator" is how I made it work (found at the bottom)
# The zh affixes have all been manually fixed so replace it with care.
# The very last script is meant to swap prefixes with suffixes in the language in case it's needed (was requested due to misunderstanding, but it exists, so...)

import re
import unicodedata

# Function to check if a word is in the extended Latin alphabet
def is_latin(word):
    for char in word:
        # Get the Unicode code point of the character
        code_point = ord(char)
        # Check if the code point is in the range of the Latin Alphabet or Special Characters (for nidoran male and female symbols)
        # This was meant to integrate another script that could behave differently for non Latin languages. Not implemented
        if not (0x0020 <= code_point <= 0x02AF or 0x2600 <= code_point <= 0x26FF):
            return False
    return True

#Compare Name Prefixes (to consonant) -> Try to keep shorter than 6ch long
def find_prefixes(pokemon_name):
    result = []
    processed = {}  # This dictionary will keep track of the names that have been processed
    for word in pokemon_name:
        base_word = word  # Treat regional variants as separate entries
        if base_word not in processed:  # Only process the name if it hasn't been processed before
            prefix = ""
            for other_word in pokemon_name:
                other_base_word = other_word
                if base_word != other_base_word:
                    temp_prefix = ""
                    for w, o in zip(base_word, other_base_word):
                        if w == o:
                            temp_prefix += w
                        else:
                            break
                    if len(temp_prefix) > len(prefix):
                        prefix = temp_prefix
            # Check if the longest shared prefix is the entire species name
            if len(prefix) == len(base_word):
                processed[base_word] = prefix
            else:
                # Add the next character in the name to the 'root' of the prefix
                root = prefix + base_word[len(prefix)]
                # If the root of the prefix ends in a consonant, that should be the result
                if root[-1].lower() in "bcdfghjklmnpqrstvwxzçßñ":
                    processed[base_word] = root
                elif len(root) >= 6:  # Check if the 'root' is 6 characters or longer
                    processed[base_word] = root
                else:  # Try to create an extension to the next consonant
                    extension = ""
                    for char in base_word[len(root):]:
                        extension += char
                        if char.lower() in "bcdfghjklmnpqrstvwxzçßñ":
                            break
                    # Check if the root+extension will be longer than 6 characters
                    if len(root + extension) > 6:
                        processed[base_word] = root
                    else:
                        processed[base_word] = root + extension
        result.append(processed[base_word])
    return result


#Compare Name Suffixes (to vowel) -> Try to keep shorter than 6ch long
def find_suffixes(pokemon_name):
    result = []
    processed = {}  # This dictionary will keep track of the names that have been processed
    for word in pokemon_name:
        base_word = word  # Treat regional variants as separate entries
        if base_word not in processed:  # Only process the name if it hasn't been processed before
            suffix = ""
            for other_word in pokemon_name:
                other_base_word = other_word
                if base_word != other_base_word:
                    temp_suffix = ""
                    for w, o in zip(base_word[::-1], other_base_word[::-1]):
                        if w == o:
                            temp_suffix = w + temp_suffix
                        else:
                            break
                    if len(temp_suffix) > len(suffix):
                        suffix = temp_suffix
            # Check if the longest shared suffix is the entire species name
            if len(suffix) == len(base_word):
                processed[base_word] = suffix
            else:
                # Add the next character in the name to the 'root' of the suffix
                root = base_word[len(base_word) - len(suffix) - 1] + suffix
                # If the root of the suffix ends in a vowel, that should be the result
                if root[0].lower() in "aeiouyáééíóúàèìòùâêîôûäëïöüãẽĩõũæœøýỳÿŷỹ":
                    processed[base_word] = root
                elif len(root) >= 6:  # Check if the 'root' is 6 characters or longer
                    processed[base_word] = root
                else:  # Try to create an extension to the next vowel
                    extension = ""
                    for char in base_word[len(base_word) - len(root) - 1::-1]:
                        extension = char + extension
                        if char.lower() in "aeiouyáééíóúàèìòùâêîôûäëïöüãẽĩõũæœøýỳÿŷỹ":
                            break
                    # Check if the root+extension will be longer than 6 characters
                    if len(extension + root) > 6:
                        processed[base_word] = root
                    else:
                        processed[base_word] = extension + root
        # Ensure the first character of the suffix is a lowercase letter
        processed[base_word] = processed[base_word][0].lower() + processed[base_word][1:]
        # Check if the character before the suffix is a hyphen
        if len(base_word) > len(processed[base_word]) and base_word[len(base_word) - len(processed[base_word]) - 2] == '-':
            processed[base_word] = '-' + processed[base_word]
        result.append(processed[base_word])
    return result


def generate_pokemon(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:  # Specify the encoding here
        lines = file.readlines()

    pokemon = {}
    pattern = r'\"(.*?)\"'

    for line in lines:
        matches = re.findall(pattern, line)
        if matches and ':' in line:
            # Keep the key and value from the input
            key = matches[0]
            value = matches[1]
            pokemon[key] = value

    return pokemon

def combine_scripts(file_path):
    pokemon_dict = generate_pokemon(file_path)

    prefixes = find_prefixes(list(pokemon_dict.values()))
    suffixes = find_suffixes(list(pokemon_dict.values()))

    output = "import { FusionTranslationEntries } from \"#app/interfaces/locales\";\n\n"
    output += "export const fusionAffixes: FusionTranslationEntries = {\n"
    output += "  shouldReverse: \"false\",\n"

    for word, prefix, suffix in zip(pokemon_dict.keys(), prefixes, suffixes):
        output += f"  {word}: {{\n"
        output += f"    fusionPrefix: \"{prefix}\",\n"
        output += f"    fusionSuffix: \"{suffix}\",\n"
        output += "  },\n"

    output += "} as const;"

    # Write the output to a file
    with open('pokemon-fusion-affixes.ts', 'w', encoding='utf-8') as file:  # Specify the encoding here
        file.write(output)

    print ("pokemon-fusion-affixes.ts created")

# Specify the path to your file
file_path = r"pokemon.ts"

# Call the combined function
combine_scripts(file_path)


#universal-fusion-affixes-generator
""""import re

def find_prefixes(word_list):
    result = []
    for word in word_list:
        prefix = ""
        for other_word in word_list:
            if word != other_word:
                temp_prefix = ""
                for w, o in zip(word, other_word):
                    if w == o:
                        temp_prefix += w
                    else:
                        break
                if len(temp_prefix) > len(prefix):
                    prefix = temp_prefix
        if len(prefix) < len(word):
            result.append(prefix + word[len(prefix)])
        else:
            result.append(prefix)
    return result

def find_suffixes(word_list):
    result = []
    for word in word_list:
        suffix = ""
        for other_word in word_list:
            if word != other_word:
                temp_suffix = ""
                for w, o in zip(word[::-1], other_word[::-1]):
                    if w == o:
                        temp_suffix = w + temp_suffix
                    else:
                        break
                if len(temp_suffix) > len(suffix):
                    suffix = temp_suffix
        if len(suffix) < len(word):
            result.append(word[-len(suffix)-1] + suffix)
        else:
            result.append(suffix)
    return result

def generate_pokemon(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:  # Specify the encoding here
        lines = file.readlines()

    pokemon = {}
    pattern = r'\"(.*?)\"'

    for line in lines:
        matches = re.findall(pattern, line)
        if matches and ':' in line:
            # Keep the key and value from the input
            key = matches[0]
            value = matches[1]
            pokemon[key] = value

    return pokemon

def combine_scripts(file_path):
    pokemon_dict = generate_pokemon(file_path)

    prefixes = find_prefixes(list(pokemon_dict.values()))
    suffixes = find_suffixes(list(pokemon_dict.values()))

    output = "import { FusionTranslationEntries } from \"#app/interfaces/locales\";\n\n"
    output += "export const fusionAffixes: FusionTranslationEntries = {\n"
    for word, prefix, suffix in zip(pokemon_dict.keys(), prefixes, suffixes):
        output += f"  {word}: {{\n"
        output += f"    fusionPrefix: \"{prefix}\",\n"
        output += f"    fusionSuffix: \"{suffix}\",\n"
        output += "  },\n"

    output += "} as const;\n"

    # Write the output to a file
    with open('pokemon-fusion-affixes.ts', 'w', encoding='utf-8') as file:  # Specify the encoding here
        file.write(output)

    print ("pokemon-fusion-affixes.ts created")

# Specify the path to your file
file_path = r"pokemon.ts"

# Call the combined function
combine_scripts(file_path)"""

#change the order of affixes and suffixes (requested for zh translations)
# TURNED OUT TO BE UNNECESSARY, BUT IT'S HERE IF ANYONE NEEDS IT...
"""import re

def swap_fusion_entries(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    pattern = r'(fusionPrefix: ")(.*?)(",\n    fusionSuffix: ")(.*?)(")'
    swapped_content = re.sub(pattern, r'\1\4\3\2\5', content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(swapped_content)

# Call the function with the path to your file
swap_fusion_entries('[zh]pokemon-fusion-affixes.ts')
"""