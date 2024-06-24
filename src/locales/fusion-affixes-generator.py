#This script produces the list of affixes (prefix and suffix) used to create the fusion names.
# Run it from the folder in which the pokemon.ts file is located, ex. "src\locales\de\"
# If the language doesn't use roman characters but uses an alphabet, it's possible to include the vowel/consonant characters to the script and use it's functionalities
# For ideographic languages, a different approach is needed. For now, the "universal-fusion-affixes-generator" is how I made it work (found at the bottom)
# The zh affixes have all been manually fixed so replace it with care. In case a new zh file is needed, prefixes and suffixes also need to be swapped due to differences in syntax. For that, use the very last script

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

#Compare Name Prefixes (to first consonant)
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
        # Find the first consonant after the prefix
        suffix = ""
        for i, char in enumerate(word[len(prefix):]):
            suffix += char
            if char.lower() in "bcdfghjklmnpqrstvwxzçßñ":
                # Check if the next character is a hyphen
                if i+1 < len(word[len(prefix):]) and word[len(prefix)+i+1] == '-':
                    suffix += '-'
                break
        result.append(prefix + suffix)
    return result

#Compare Name Suffixes (to vowel)
def find_suffixes(pokemon_name):
    result = []
    for word in pokemon_name:
        suffix = ""
        for other_word in pokemon_name:
            if word != other_word:
                temp_suffix = ""
                for w, o in zip(word[::-1], other_word[::-1]):
                    if w == o:
                        temp_suffix = w + temp_suffix
                    else:
                        break
                if len(temp_suffix) > len(suffix):
                    suffix = temp_suffix
        # Find the first vowel before the suffix
        prefix = ""
        for i, char in enumerate(word[len(word)-len(suffix)-1::-1]):
            prefix = char + prefix
            if char.lower() in "aeiouyáééíóúàèìòùâêîôûäëïöüãẽĩõũæœøýỳÿŷỹ":
                # Check if the next character is a hyphen
                if i+1 < len(word) and word[len(word)-len(suffix)-i-2] == '-':
                    prefix = '-' + prefix
                break
        # Make sure the first character is lowercase
        output = (prefix + suffix)
        output = output[0].lower() + output[1:]
        result.append(output)
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