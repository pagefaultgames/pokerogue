import re

filenames = [['src/enums/moves.ts', 'move'], ['src/enums/abilities.ts', 'ability'], ['src/enums/species.ts', 'Pokémon']]

commentBlockStart   = re.compile('\/\*[^\*].*')     # Regex for the start of a comment block
commentBlockEnd     = re.compile('.*,\*\/')         # Regex for the end of a comment block 

commentExp  = re.compile('(?:\/\*\*.*\*\/)')    # Regex for a url comment that already existed in the file
enumExp     = re.compile('.*,')                 # Regex for a regular enum line

numberExp = re.compile(' +\= +\d+,')

replaceList = ['ALOLA', 'ETERNAL', 'GALAR', 'HISUI', 'PALDEA', 'BLOODMOON']

for args in filenames:

    output = ''

    skip = False # True when we should completely stop adding url comments for any reason
    blockComment = False # True when currently reading a comment block

    file = open(args[0], 'r')
    line = file.readline()

    while line:
        if(skip): # Appends the next line in the file and moves on if we already hit the end of the enum
            output += line
            line = file.readline()
            continue

        skip = line.find('};') != -1 # True if we reached the end of an enum definition

        # Determines when a comment block has started and we should stop adding url comments
        if (commentBlockStart.findall(line)):
            blockComment = True

        if(not commentExp.findall(line)):
            urlInsert = numberExp.sub('', line).strip().rstrip('\n').rstrip(',').title() # Clean up the enum line to only the enum
            for replace in replaceList:
                urlInsert = urlInsert.replace(replace.title() + '_', '')
            if (not blockComment and enumExp.findall(line)):
                output += '  /**{@link https://bulbapedia.bulbagarden.net/wiki/' + urlInsert + '_(' + args[1] + ') | Source} */\n'
            output += line # Add the line to output since it isn't an existing url comment

        # Determines if we're at the end of a comment block and can resume adding url comments
        if (blockComment):
            blockComment = not commentBlockEnd.findall(line)

        line = file.readline()

    file.close()

    file = open(args[0], 'w', encoding='utf-8')
    file.write(output,)
    file.close