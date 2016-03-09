import csv
import shutil
import os.path
import tempfile

from py_scripts.trans_csv_to_json import main as csv_to_json
from py_scripts.trans_json_to_csv import main as json_to_csv


def test_full_cycle():
    """
    Start at one point, translate a CSV to JSON,
    then return it to a CSV and compare.
    """

    tempdir = tempfile.mkdtemp()

    try:
        csv_input_file = os.path.join(tempdir, 'initial.csv')
        json_int_file = os.path.join(tempdir, 'intermediate.json')
        csv_final_file = os.path.join(tempdir, 'final.csv')

        with open(csv_input_file, 'w') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['key', 'Header Two'])
            writer.writerow([1, 2])
            writer.writerow([3, 4])

        csv_to_json(csv_filename=csv_input_file,
                    json_filename=json_int_file)
        json_to_csv(json_filename=json_int_file,
                    csv_filename=csv_final_file)

        with open(csv_input_file, 'r') as first_file:
            with open(csv_final_file, 'r') as final_file:
                for _ in range(3):
                    assert first_file.readline() == final_file.readline()
    finally:
        shutil.rmtree(tempdir)
