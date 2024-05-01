import fs from 'fs';
import cheerio from 'cheerio';
import path from 'path';

// Create the biomeData directory if it doesn't exist
if (!fs.existsSync('./biomeData')) {
  fs.mkdirSync('./biomeData');
}

// Get the list of HTML files in the archive directory
const files = fs.readdirSync('./archive');

files.forEach(file => {
  // Read the HTML file
  const html = fs.readFileSync(path.join('./archive', file), 'utf-8');

  // Parse the HTML
  const $ = cheerio.load(html);

  // Extract the data you want
  const data = [];
  const validTitles = ["Common", "Uncommon", "Rare", "Super Rare", "Ultra Rare", "Boss", "Boss Rare", "Boss Super Rare", "Boss Ultra Rare"];
  $('table.inline').each((i, table) => {
    const rarity = $(table).find('th.col0').text().trim();
    const species = [];
    $(table).find('tr').each((j, tr) => {
      if (j >= 2 && (j - 2) % 3 === 0) {
        $(tr).find('td').each((k, td) => {
          const name = $(td).text().trim();
          const time = validTitles.includes(rarity) ? $(tr).next().find(`td:nth-child(${k + 1})`).text().trim() : '';
          if (name) {
            species.push({ name, time });
          }
        });
      }
    });
    if (validTitles.includes(rarity)) {
      data.push({ rarity, species });
    } else {
      data.push({ gym_leader: rarity, team: species.map(s => s.name) });
    }
  });

  // Convert the data to JSON
  const json = JSON.stringify(data, null, 2);

  // Write the JSON data to a file in the biomeData directory
  const jsonFilename = path.join('./biomeData', `${path.basename(file, '.html')}.json`);
  fs.writeFileSync(jsonFilename, json);
});