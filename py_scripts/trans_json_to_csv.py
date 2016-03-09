# Python(3) script to take the translations.json file
# and convert it into a CSV file with each language
# as a column.
#
# The intent of the CSV file is to make it easier for
# a translator to work with the translations, via spreadsheet,
# and see the English-vs-Spanish (or Chinese, etc) side
# by side. Using a single file, vs file-per-language,
# should make it easier to spot gaps between languages.
#
# Note that Excel will need to be told the CSV file is in UTF-8.
# See instructions at 
#   https://www.itg.ias.edu/content/how-import-csv-file-uses-utf-8-character-encoding-0
# 
# There is another tool for converting from CSV back into JSON.
#
# By using both tools, round-tripping is supported.

import json
import csv
import time
import os
import shutil

def main(json_filename='translations.json',
         csv_filename='translations.csv'):
    # Get the JSON translations.
    translations = None
    with open(json_filename, "r", encoding="utf-8") as json_fp:
        translations = json.load(json_fp)

    # Make list of languages, and assemble union of all the keys.
    languages = sorted(translations.keys())
    text_items = set()
    for lang in languages:
        text_items |= set(translations[lang].keys())
    text_items = sorted(text_items)

    # save the prior file
    if os.path.exists(csv_filename):
        timestamped_csv = time.strftime("translations_%Y%m%d_%H%M%S.csv")
        shutil.move(csv_filename, timestamped_csv)

    # write the CSV
    with open(csv_filename, "w", encoding="utf-8", newline="") as csv_fp:
        writer = csv.writer(csv_fp)
        writer.writerow(["key"] + languages)
        for text in text_items:
            row = [text] + [translations[lang].get(text, "") for lang in languages]
            writer.writerow(row)


if __name__ == "__main__":
    main()

