# Python(3) script to take a translations.csv file
# and convert it into a JSON file that the app can use,
# with language-names as the top key, and key: translation
# below that.
#
# The intent is to make it easy for a translator. The 
# translator can work in a spreadsheet, but still create
# a valid JSON file with this tool.
#
# Using this tool should also prevent subtle JSON syntax
# errors.
#
# There is another tool that converts the translations from
# JSON to CSV.
#
# By using both tools, round-tripping is supported.

import json
import csv
import time
import os
import shutil


def main(csv_filename='translations.csv',
         json_filename='translations.json'):
    # Get CSV translations
    translations = {}
    with open(csv_filename, "r", encoding="utf-8") as csv_fp:
        reader = csv.reader(csv_fp)
        header = next(reader)
        assert(header[0] == "key")
        for lang in header[1:]:
            translations[lang] = {}
        for row in reader:
            for i,lang in enumerate(header[1:]):
                translations[lang][row[0]] = row[i+1]

    # save prior file
    if os.path.exists(json_filename):
        timestamped_json = time.strftime("translations_%Y%m%d_%H%M%S.json")
        shutil.move(json_filename, timestamped_json)

    # save as JSON
    with open(json_filename, "w", encoding="utf-8") as json_fp:
        json.dump(translations, json_fp, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
